import type { PaymentGateway } from '../application/payment-gateway.ts';

export class StripePaymentGateway implements PaymentGateway {
  async charge(_amountMinor: string): Promise<void> {}
}
