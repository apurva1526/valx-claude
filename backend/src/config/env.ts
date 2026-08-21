import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  twoFactorApiKey: process.env.TWO_FACTOR_API_KEY,
  // A reserved 10-digit number + fixed code that App Store/Play Store reviewers can use to sign in
  // without receiving a real SMS. Leave DEMO_PHONE_NUMBER unset to disable this entirely.
  demoPhoneNumber: process.env.DEMO_PHONE_NUMBER,
  demoOtpCode: process.env.DEMO_OTP_CODE ?? "123456",
};
