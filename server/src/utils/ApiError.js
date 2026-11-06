export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details; // optional, e.g. validation issues or conflicting seats
  }
}
