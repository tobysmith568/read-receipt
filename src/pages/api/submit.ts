import type { APIRoute } from "astro";
import { firstEmailAsHtml } from "../../emails/first-email";
import { getDomainForRequest } from "../../utils/domain";
import { sendHtml } from "../../utils/email";
import { getCurrentTimestampUTC } from "../../utils/time";

export interface SubmitRequest {}

export interface SubmitResponse {
  success: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    await handleRequest(request);
    return jsonResponse({ success: true }, 200);
  } catch {
    return jsonResponse({ success: false }, 500);
  }
};

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
