import { ADMIN_PORT } from "./mail-server";

const ADMIN_URL = `http://localhost:${ADMIN_PORT}`;

export interface CapturedEmail {
  html: string;
  subject: string;
}

export const deleteAllEmails = async (): Promise<void> => {
  await fetch(`${ADMIN_URL}/reset`, { method: "POST" });
};

export const getLastEmail = async (email: string): Promise<CapturedEmail | undefined> => {
  const response = await fetch(`${ADMIN_URL}/last-email?to=${encodeURIComponent(email)}`);

  if (!response.ok) {
    return undefined;
  }

  return response.json();
};
