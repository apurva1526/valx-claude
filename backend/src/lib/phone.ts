// Contacts-picker numbers arrive as +91XXXXXXXXXX; manually-typed numbers arrive bare.
// Canonicalize to the last 10 digits so both forms compare equal everywhere phone
// numbers are stored or looked up.
export function normalizePhoneNumber(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  return digitsOnly.slice(-10);
}
