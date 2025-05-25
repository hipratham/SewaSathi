
import { type NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken as string;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const decodedIdToken = await admin.auth().verifyIdToken(idToken);

    // Only create a session cookie if the user is verified and the token is fresh.
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) { // 5 minutes
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
      
      const options = {
        name: 'session',
        value: sessionCookie,
        maxAge: expiresIn / 1000, // maxAge is in seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax' as const,
      };

      cookies().set(options);
      
      return NextResponse.json({ status: 'success' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Recent sign-in required for session cookie.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session cookie.' }, { status: 500 });
  }
}
