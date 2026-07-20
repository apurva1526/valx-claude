// Swap point for the real SMS gateway once it's off mid-KYC approval.
// Everything outside this file should only ever call sendOtp/verifyOtp.
const DEV_FIXED_OTP = "1234";

export async function sendOtp(phoneNumber: string): Promise<void> {
  console.log(`[otp:stub] would send OTP to ${phoneNumber}: ${DEV_FIXED_OTP}`);
}

export function verifyOtp(phoneNumber: string, otp: string): boolean {
  return otp === DEV_FIXED_OTP;
}
