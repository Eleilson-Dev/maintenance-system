export class AppError extends Error {
  statusCode: number;

  constructor(statusCode = 400, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
