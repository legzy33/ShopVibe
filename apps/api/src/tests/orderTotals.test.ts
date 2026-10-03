import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals, convertFromBase, formatPrice } from '@shopvibe/shared';

test('totals in the base currency', () => {
  const totals = calculateOrderTotals([{ price: 24, quantity: 3 }, { price: 12.99, quantity: 3 }]);

  assert.equal(totals.subtotal, 110.97);
  assert.equal(totals.tax, 22.19);
  assert.equal(totals.shipping, 0);
  assert.equal(totals.total, 133.16);
});

test('shipping is charged below the threshold and free from exactly 50', () => {
  const below = calculateOrderTotals([{ price: 49.99, quantity: 1 }]);
  assert.equal(below.shipping, 9.99);
  assert.equal(below.amountToFreeShipping, 0.01);
  assert.equal(below.tax, 10);
  assert.equal(below.total, 69.98);

  const exact = calculateOrderTotals([{ price: 25, quantity: 2 }]);
  assert.equal(exact.shipping, 0);
  assert.equal(exact.amountToFreeShipping, 0);
  assert.equal(exact.total, 60);
});

test('converted unit prices are rounded first so lines add up to the subtotal', () => {
  const rate = 1.176;
  const totals = calculateOrderTotals([{ price: 24, quantity: 3 }, { price: 12.99, quantity: 3 }], rate);

  assert.deepEqual(totals.lines.map(line => line.unitPrice), [28.22, 15.28]);
  assert.deepEqual(totals.lines.map(line => line.lineTotal), [84.66, 45.84]);
  assert.equal(totals.subtotal, 130.5);
  assert.equal(totals.tax, 26.1);
  assert.equal(totals.total, 156.6);
});

test('free shipping is judged in the base currency, the fee is converted', () => {
  // 45 GBP is over 50 in EUR or USD but must still pay shipping
  const totals = calculateOrderTotals([{ price: 45, quantity: 1 }], 1.3201);

  assert.equal(totals.subtotal, 59.4);
  assert.equal(totals.shipping, 13.19);
  assert.equal(totals.amountToFreeShipping, 6.6);
});

test('parts always add up to the total', () => {
  for (const rate of [1, 1.176, 1.3201, 0.8437]) {
    for (const price of [0.01, 0.99, 9.99, 12.99, 33.33, 49.995, 299.99]) {
      for (const quantity of [1, 2, 3, 7]) {
        const totals = calculateOrderTotals([{ price, quantity }, { price: 5.55, quantity: 2 }], rate);
        const lineSum = totals.lines.reduce((sum, line) => sum + line.lineTotal, 0);

        assert.equal(Number(lineSum.toFixed(2)), totals.subtotal);
        assert.equal(Number((totals.subtotal + totals.tax + totals.shipping).toFixed(2)), totals.total);
      }
    }
  }
});

test('an empty cart costs only shipping', () => {
  const totals = calculateOrderTotals([]);
  assert.equal(totals.subtotal, 0);
  assert.equal(totals.tax, 0);
});

test('conversion and formatting', () => {
  assert.equal(convertFromBase(299.99, 1.176), 352.79);
  assert.equal(convertFromBase(10), 10);
  assert.equal(formatPrice(1234.5), '£1,234.50');
  assert.equal(formatPrice(352.79, 'EUR'), '€352.79');
  assert.equal(formatPrice(396.02, 'USD'), '$396.02');
});
