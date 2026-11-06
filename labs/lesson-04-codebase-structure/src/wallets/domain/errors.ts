// Lỗi nghiệp vụ: chỉ có mã, không biết gì về HTTP. Tầng presentation mới đổi mã thành status.
export class DomainError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
