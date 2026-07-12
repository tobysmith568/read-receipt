import type { APIRoute } from "astro";
import { firstEmailAsHtml } from "../../emails/first-email";
import { getDomainForRequest } from "../../utils/domain";
import { sendHtml } from "../../utils/email";
import { getEnv } from "../../utils/env";
import { getCurrentTimestampUTC } from "../../utils/time";

export type SubmitRequest = {};

export interface SubmitResponse {
  success: boolean;
  error?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    await handleRequest(request);
    return jsonResponse({ success: true }, 200);
  } catch (error) {
    return jsonResponse(
      { success: false, ...(getEnv().dev.isDev && { error: describeError(error) }) },
      500
    );
  }
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const handleRequest = async (request: Request) => {
  const currentDomain = getDomainForRequest(request);

  const body = await request.json();
  const recipientEmailAddress = body.email;
  const recipientEmailAddressBase64 = encodeURIComponent(recipientEmailAddress);

  const timestamp = getCurrentTimestampUTC();

  const emailContentAsHtml = firstEmailAsHtml({
    domain: currentDomain,
    urlSafeEmail: recipientEmailAddressBase64,
    timestamp
  });

  await sendHtml(recipientEmailAddress, "Read Receipt", emailContentAsHtml);
};

const jsonResponse = (body: SubmitResponse, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
