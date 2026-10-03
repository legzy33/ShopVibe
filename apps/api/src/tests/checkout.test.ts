import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { PrismaClient } from '@prisma/client';

const API_ROOT = path.resolve(__dirname, '../..');
const RATES = { EUR: 1.2, USD: 1.3 };
const ADDRESS = {
  fullName: 'Test Buyer',
  street: '1 High Street',
  city: 'London',
  zipCode: 'SW1A 1AA',
  country: 'GB',
  phone: '07000 000000'
};

let tempDir: string;
let server: Server;
let baseUrl: string;
let prisma: PrismaClient;
let token: string;
let cheapProductId: string;
const realFetch = globalThis.fetch;

const api = async (method: string, route: string, body?: unknown, authToken: string | null = token) => {
  const response = await realFetch(`${baseUrl}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return { status: response.status, body: await response.json() as any };
};

const placeOrder = (extra: Record<string, unknown> = {}) =>
  api('POST', '/api/orders', { shippingAddress: ADDRESS, billingAddress: ADDRESS, paymentMethod: 'STRIPE', ...extra });

before(async () => {
  // A throwaway database built from the current schema, never the dev one
  tempDir = mkdtempSync(path.join(tmpdir(), 'shopvibe-test-'));
  process.env.NODE_ENV = 'test';
  process.env.TEST_DATABASE_URL = `file:${path.join(tempDir, 'test.db')}`;
  process.env.JWT_SECRET = 'test-secret';
  process.env.ADMIN_EMAILS = 'admin@example.com';
  // Left empty (not deleted) so the .env file cannot fill them in: tests never call the payment providers
  process.env.STRIPE_SECRET_KEY = '';
  process.env.PAYPAL_CLIENT_ID = '';
  process.env.STRIPE_WEBHOOK_SECRET = '';

  // The exchange-rate service is replaced with fixed rates
  globalThis.fetch = (async (input: any, init?: any) => {
    if (String(input).includes('frankfurter')) {
      return new Response(JSON.stringify({ base: 'GBP', rates: RATES }), { status: 200 });
    }
    return realFetch(input, init);
  }) as typeof fetch;

  ({ prisma } = await import('../config/database'));

  const schemaSql = execSync(
    'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
    { cwd: API_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
  );
  for (const statement of schemaSql.split(';\n').map(part => part.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }

  const product = (name: string, price: number, inStock = true) => prisma.product.create({
    data: { name, description: name, price, imageUrl: 'https://example.com/image.jpg', category: 'test', inStock }
  });
  cheapProductId = (await product('Cheap', 12.99)).id;
  await product('Sold out', 5, false);

  const { app } = await import('../app');
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const registered = await api('POST', '/api/auth/register', { name: 'Test Buyer', email: 'Buyer@Example.com', password: 'password123' }, null);
  assert.equal(registered.status, 201);
  token = registered.body.token;
});

after(async () => {
  globalThis.fetch = realFetch;
  server?.close();
  await prisma?.$disconnect();
  rmSync(tempDir, { recursive: true, force: true });
});

test('emails are stored lowercased and login ignores case', async () => {
  assert.equal((await prisma.user.findFirstOrThrow()).email, 'buyer@example.com');

  const login = await api('POST', '/api/auth/login', { email: 'BUYER@example.com', password: 'password123' }, null);
  assert.equal(login.status, 200);
});

test('invalid input is a 400, not a server error', async () => {
  assert.equal((await api('POST', '/api/auth/login', { email: 'nope', password: '' }, null)).status, 400);
  assert.equal((await api('GET', '/api/products?page=abc', undefined, null)).status, 400);
});

test('orders need a signed-in user and a non-empty cart', async () => {
  assert.equal((await placeOrder().then(r => r.status)), 400); // empty cart
  const anonymous = await api('POST', '/api/orders', { shippingAddress: ADDRESS, billingAddress: ADDRESS, paymentMethod: 'STRIPE' }, null);
  assert.equal(anonymous.status, 401);
});

test('an order is priced in GBP by default', async () => {
  assert.equal((await api('POST', '/api/cart/items', { productId: cheapProductId, quantity: 2 })).status, 201);

  const { status, body } = await placeOrder();
  assert.equal(status, 201);
  assert.equal(body.order.currency, 'GBP');
  assert.equal(body.order.exchangeRate, 1);
  assert.equal(body.order.subtotal, 25.98);
  assert.equal(body.order.tax, 5.2);
  assert.equal(body.order.shipping, 9.99);
  assert.equal(body.order.total, 41.17);
  assert.equal(body.order.shippingAddress.state, ''); // county is optional
});

test('checking out again reuses the unpaid order and reprices it in the chosen currency', async () => {
  const first = await prisma.order.findFirstOrThrow();

  const { status, body } = await placeOrder({ currency: 'EUR' });
  assert.equal(status, 200);
  assert.equal(body.order.id, first.id);
  assert.equal(body.order.currency, 'EUR');
  assert.equal(body.order.exchangeRate, RATES.EUR);
  assert.equal(body.order.items[0].price, 15.59); // 12.99 * 1.2, rounded
  assert.equal(body.order.subtotal, 31.18);
  assert.equal(body.order.tax, 6.24);
  assert.equal(body.order.shipping, 11.99);
  assert.equal(body.order.total, 49.41);

  assert.equal(await prisma.order.count(), 1);
  assert.equal(await prisma.orderItem.count(), 1);
});

test('unsupported currencies and incomplete addresses are rejected', async () => {
  assert.equal((await placeOrder({ currency: 'JPY' })).status, 400);
  assert.equal((await placeOrder({ shippingAddress: { ...ADDRESS, street: '' } })).status, 400);
});

test('the cart summary uses the same maths in the base currency', async () => {
  const { body } = await api('GET', '/api/cart');
  assert.deepEqual(
    { ...body.cart.summary },
    { itemCount: 2, currency: 'GBP', subtotal: 25.98, tax: 5.2, shipping: 9.99, total: 41.17 }
  );
});

test('out-of-stock products cannot be added to the cart', async () => {
  const soldOut = await prisma.product.findFirstOrThrow({ where: { inStock: false } });
  assert.equal((await api('POST', '/api/cart/items', { productId: soldOut.id, quantity: 1 })).status, 400);
});

test('a payment error leaves the order awaiting payment', async () => {
  const order = await prisma.order.findFirstOrThrow();
  await prisma.order.update({ where: { id: order.id }, data: { paymentIntentId: 'pi_test' } });

  // Stripe is not configured in tests, so verification throws
  const verify = await api('POST', '/api/payments/verify', { orderId: order.id, paymentId: 'pi_test', paymentMethod: 'STRIPE' });
  assert.equal(verify.status, 500);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, 'PENDING');
});

test('the Stripe webhook refuses unsigned or unconfigured calls', async () => {
  const unsigned = await realFetch(`${baseUrl}/api/payments/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(unsigned.status, 400);

  const unconfigured = await realFetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=bad' },
    body: '{}'
  });
  assert.equal(unconfigured.status, 503);
});

test('refunds are for admins only', async () => {
  const order = await prisma.order.findFirstOrThrow();
  assert.equal((await api('POST', '/api/payments/refund', { orderId: order.id })).status, 403);
});

test('a paid order cannot be cancelled, an unpaid one can', async () => {
  const order = await prisma.order.findFirstOrThrow();

  await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED', paymentStatus: 'COMPLETED' } });
  assert.equal((await api('POST', `/api/orders/${order.id}/cancel`)).status, 400);

  await prisma.order.update({ where: { id: order.id }, data: { status: 'PENDING', paymentStatus: 'PENDING' } });
  const cancelled = await api('POST', `/api/orders/${order.id}/cancel`);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.order.status, 'CANCELLED');
});

test('a review is verified only once its author has paid for the product', async () => {
  assert.equal((await api('POST', '/api/reviews', { productId: cheapProductId, rating: 5, comment: 'Great' })).body.review.verified, false);

  const before = await api('GET', `/api/reviews/product/${cheapProductId}`, undefined, null);
  assert.equal(before.body.data[0].verified, false);
  assert.equal(before.body.statistics.verifiedPurchases, 0);

  const order = await prisma.order.findFirstOrThrow();
  await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED', paymentStatus: 'COMPLETED' } });

  const afterPurchase = await api('GET', `/api/reviews/product/${cheapProductId}`, undefined, null);
  assert.equal(afterPurchase.body.data[0].verified, true);
  assert.equal(afterPurchase.body.statistics.verifiedPurchases, 1);
});
