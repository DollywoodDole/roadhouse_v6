import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

/**
 * Verify a wallet session JWT.
 * Used by middleware (proxy.ts) and any server route that needs to resolve
 * the current wallet session without a KV lookup.
 *
 * Returns null if the token is missing, expired, or invalid.
 */
export async function verifyWalletSession(token: string): Promise<{
  publicKey:  string;
  customerId: string | null;
  isMember:   boolean;
  tier:       string | null;
  provider:   'wallet';
} | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      publicKey:  string;
      customerId: string | null;
      isMember:   boolean;
      tier:       string | null;
      provider:   'wallet';
    };
  } catch {
    return null;
  }
}
