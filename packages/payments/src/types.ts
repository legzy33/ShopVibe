export interface CreateOrderParams {
  amount: number
  currency: string
  cartId: string
  customerId?: string
}

export interface CreateOrderResponse {
  id: string
  clientSecret?: string
  approvalUrl?: string
}

export interface CapturePaymentParams {
  orderId: string
  paymentId: string
  expectedAmount?: number
  expectedCurrency?: string
}

export interface CapturePaymentResponse {
  status: 'success' | 'failed'
  transactionId: string
  amount: number
}

export interface RefundPaymentParams {
  transactionId: string
  amount: number
  reason?: string
}

export interface RefundPaymentResponse {
  status: 'success' | 'failed'
  refundId: string
  amount: number
}

export interface PaymentService {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResponse>
  capturePayment(params: CapturePaymentParams): Promise<CapturePaymentResponse>
  refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResponse>
} 