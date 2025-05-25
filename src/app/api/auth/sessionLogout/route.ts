
import { type NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')?.value;

    if (sessionCookie) {
      // Clear the cookie by setting its expiration to a past date
      cookies().set({
        name: 'session',
        value: '',
        maxAge: -1,
        path: '/',
      });
      
      // Optional: Revoke refresh tokens to invalidate the session on Firebase's side
      // This requires decoding the session cookie to get the UID.
      try {
        const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie);
        await admin.auth().revokeRefreshTokens(decodedClaims.sub); // sub is the user ID (uid)
      } catch (verifyError) {
        // Ignore if cookie is already invalid or expired
        console.warn('Failed to verify session cookie for revocation or cookie was invalid:', verifyError);
      }
    }
    
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error logging out session:', error);
    return NextResponse.json({ error: 'Failed to logout session.' }, { status: 500 });
  }
}
