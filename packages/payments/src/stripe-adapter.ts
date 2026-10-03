import Stripe from 'stripe'
import { PaymentService, CreateOrderParams, CreateOrderResponse, CapturePaymentParams, CapturePaymentResponse, RefundPaymentParams, RefundPaymentResponse } from './types'

export interface StripeWebhookPayment {
  paymentId: string
  orderId: string
  amount: number
  currency: string
}

export class StripeAdapter implements PaymentService {
  private stripe: Stripe

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    })
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        // Cards and wallets only: nothing that redirects away from the checkout
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          cartId: params.cartId,
          customerId: params.customerId || '',
          integration: 'shopvibe',
        },
      })

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
      }
    } catch (error) {
      console.error('Stripe createOrder error:', error)
      throw new Error('Failed to create Stripe payment intent')
    }
  }

  async capturePayment(params: CapturePaymentParams): Promise<CapturePaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(params.paymentId)

      if (paymentIntent.metadata.cartId !== params.orderId) {
        throw new Error('Stripe payment does not belong to this order')
      }

      if (params.expectedAmount !== undefined) {
        const expectedAmountInCents = Math.round(params.expectedAmount * 100)

        if (paymentIntent.amount !== expectedAmountInCents) {
          throw new Error('Stripe payment amount does not match order total')
        }
      }

      if (params.expectedCurrency && paymentIntent.currency !== params.expectedCurrency.toLowerCase()) {
        throw new Error('Stripe payment currency does not match order currency')
      }
      
      if (paymentIntent.status === 'succeeded') {
        return {
          status: 'success',
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
        }
      }

      return {
        status: paymentIntent.status === 'canceled' ? 'failed' : 'pending',
        transactionId: paymentIntent.id,
        amount: 0,
      }
    } catch (error) {
      console.error('Stripe capturePayment error:', error)
      throw new Error('Failed to capture Stripe payment')
    }
  }

  // Stop an unpaid payment intent from being completed later
  async cancelPayment(paymentId: string): Promise<void> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId)

    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status)) {
      await this.stripe.paymentIntents.cancel(paymentId)
    }
  }

  // Check a webhook's signature and return the payment it reports, if it is one we act on
  parseWebhookEvent(payload: Buffer, signature: string, webhookSecret: string): StripeWebhookPayment | null {
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    if (event.type !== 'payment_intent.succeeded') {
      return null
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent

    return {
      paymentId: paymentIntent.id,
      orderId: paymentIntent.metadata.cartId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResponse> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: params.transactionId,
        amount: Math.round(params.amount * 100),
        reason: 'requested_by_customer',
        metadata: {
          reason: params.reason || 'Customer requested refund',
        },
      })

      return {
        status: refund.status === 'succeeded' ? 'success' : 'failed',
        refundId: refund.id,
        amount: refund.amount / 100,
      }
    } catch (error) {
      console.error('Stripe refundPayment error:', error)
      throw new Error('Failed to process Stripe refund')
    }
  }
} 