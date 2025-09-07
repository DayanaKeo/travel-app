import "server-only";
import crypto from "crypto";

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
export function addHours(h = 24) {
  return new Date(Date.now() + h * 3600 * 1000);
}
