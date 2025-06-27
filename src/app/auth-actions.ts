
'use server';

import { cookies } from 'next/headers';

const PASSWORD = process.env.ADMIN_PASSWORD;
const AUTH_COOKIE_NAME = 'is_admin_authed';

export async function login(password: string): Promise<{ success: boolean; message: string }> {
  if (!PASSWORD) {
    const errorMessage = "ADMIN_PASSWORD environment variable not set on the server.";
    console.error(errorMessage);
    return { success: false, message: "Server configuration error. Please contact administrator." };
  }

  if (password === PASSWORD) {
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return { success: true, message: 'Login successful' };
  }

  return { success: false, message: 'Invalid password.' };
}

export async function logout(): Promise<void> {
  cookies().delete(AUTH_COOKIE_NAME);
}

export async function checkAuth(): Promise<{ isAuthenticated: boolean }> {
  try {
    const cookieStore = cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    const isAuthenticated = authCookie?.value === 'true';
    return { isAuthenticated };
  } catch (error) {
    console.error("Could not access cookies. User will be treated as logged out.", error);
    // In environments where cookies are not available (e.g. during build),
    // treat the user as not authenticated.
    return { isAuthenticated: false };
  }
}
