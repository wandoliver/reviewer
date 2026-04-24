export class RequestValidationError extends Error {}

export class UpstreamApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly type?: string
  ) {
    super(message);
  }
}
