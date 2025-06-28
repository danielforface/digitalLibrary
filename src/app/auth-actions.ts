
'use server';

const PASSWORD = process.env.ADMIN_PASSWORD;

export async function login(password: string): Promise<{ success: boolean; message: string }> {
  if (!PASSWORD) {
    const errorMessage = "ADMIN_PASSWORD environment variable not set on the server.";
    console.error(errorMessage);
    return { success: false, message: "Server configuration error. Please contact administrator." };
  }

  if (password === PASSWORD) {
    return { success: true, message: 'Login successful' };
  }

  return { success: false, message: 'Invalid password.' };
}
