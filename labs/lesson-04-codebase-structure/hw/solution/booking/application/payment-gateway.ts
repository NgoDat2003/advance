// Port cho hệ thống ngoài; đây là việc điều phối nên có thể đặt ở application.
export interface PaymentGateway {
  charge(amountMinor: string): Promise<void>;
}
