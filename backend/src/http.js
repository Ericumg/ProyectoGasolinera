export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const round2 = (n) => Math.round(n * 100) / 100;
export const round3 = (n) => Math.round(n * 1000) / 1000;
