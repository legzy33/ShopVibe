const checkoutNodeJssdk = require('@paypal/checkout-server-sdk')
import { PaymentService, CreateOrderParams, CreateOrderResponse, CapturePaymentParams, CapturePaymentResponse, RefundPaymentParams, RefundPaymentResponse } from './types'

export class PayPalAdapter implements PaymentService {
  private client: any

  constructor(clientId: string, clientSecret: string, isSandbox: boolean = false) {
    const environment = isSandbox
      ? new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
      : new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    
    this.client = new checkoutNodeJssdk.core.PayPalHttpClient(environment)
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    try {
      const request = new checkoutNodeJssdk.orders.OrdersCreateRequest()
      request.prefer('return=representation')
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
          custom_id: params.cartId,
          reference_id: params.customerId || '',
        }],
        application_context: {
          brand_name: 'ShopVibe',
          user_action: 'PAY_NOW',
          return_url: 'https://shopvibe.com/checkout/success',
          cancel_url: 'https://shopvibe.com/checkout/cancel',
        },
      })

      const order = await this.client.execute(request)
      const orderData = order.result

      return {
        id: orderData.id!,
        approvalUrl: orderData.links?.find(
          (link: { rel?: string; href?: string }) => link.rel === 'approve'
        )?.href,
      }
    } catch (error) {
      console.error('PayPal createOrder error:', error)
      throw new Error('Failed to create PayPal order')
    }
  }

  async capturePayment(params: CapturePaymentParams): Promise<CapturePaymentResponse> {
    try {
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(params.paymentId)
      request.prefer('return=representation')

      const capture = await this.client.execute(request)
      const captureData = capture.result

      const purchaseUnit = captureData.purchase_units?.[0]
      const payment = captureData.purchase_units?.[0]?.payments?.captures?.[0]

      if (purchaseUnit?.custom_id !== params.orderId) {
        throw new Error('PayPal payment does not belong to this order')
      }

      if (params.expectedAmount !== undefined) {
        const capturedAmount = parseFloat(payment?.amount?.value || '0')

        if (capturedAmount !== params.expectedAmount) {
          throw new Error('PayPal payment amount does not match order total')
        }
      }

      if (
        params.expectedCurrency &&
        payment?.amount?.currency_code !== params.expectedCurrency.toUpperCase()
      ) {
        throw new Error('PayPal payment currency does not match order currency')
      }

      const failedStatuses = ['DECLINED', 'FAILED']

      return {
        status: payment?.status === 'COMPLETED'
          ? 'success'
          : failedStatuses.includes(payment?.status) ? 'failed' : 'pending',
        transactionId: payment?.id || '',
        amount: parseFloat(payment?.amount?.value || '0'),
      }
    } catch (error) {
      console.error('PayPal capturePayment error:', error)
      throw new Error('Failed to capture PayPal payment')
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResponse> {
    try {
      const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(params.transactionId)
      request.prefer('return=representation')
      request.requestBody({
        amount: {
          // PayPal refunds must be in the same currency as the original payment
          currency_code: params.currency.toUpperCase(),
          value: params.amount.toFixed(2),
        },
        note_to_payer: params.reason || 'Customer requested refund',
      })

      const refund = await this.client.execute(request)
      const refundData = refund.result

      return {
        status: refundData.status === 'COMPLETED' ? 'success' : 'failed',
        refundId: refundData.id!,
        amount: parseFloat(refundData.amount?.value || '0'),
      }
    } catch (error) {
      console.error('PayPal refundPayment error:', error)
      throw new Error('Failed to process PayPal refund')
    }
  }
} 