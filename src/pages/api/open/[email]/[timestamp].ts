import type { APIContext, APIRoute } from "astro";
import { secondEmailAsHtml, type Times, type User } from "../../../../emails/second-email";
import { getDomainForRequest } from "../../../../utils/domain";
import { sendHtml } from "../../../../utils/email";
import { getIpData, getIpFromRequest } from "../../../../utils/ip";
import {
  getCurrentTimestampUTC,
  getDifferenceBetweenTimestamps,
  printTimestamp
} from "../../../../utils/time";
import { getUserAgentData } from "../../../../utils/user-agent";

const base64pixel =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII=";

const pixelAsBuffer = Buffer.from(base64pixel, "base64");

export const GET: APIRoute = async context => {
  try {
    await handleRequest(context);
  } catch {
    // empty
  }

  return sendPixel();
};

const handleRequest = async ({ request, params }: APIContext) => {
  const { email, timestamp } = getQueryArgs(params);
  const currentDomain = getDomainForRequest(request);
  const currentTimestamp = getCurrentTimestampUTC();

  const times: Times = {
    firstEmailTimestamp: printTimestamp(Number(timestamp)),
    secondEmailTimestamp: printTimestamp(currentTimestamp),
    timestampDifference: getDifferenceBetweenTimestamps(Number(timestamp), currentTimestamp)
  };

  const ip = getIpFromRequest(request);

  const user: User = {
    email,
    ip
  };

  const ipData = await getIpData(ip);
  const userAgentData = getUserAgentData(request);

  const emailContentAsHtml = secondEmailAsHtml({
    domain: currentDomain,
    times,
    user,
    ipData,
    userAgentData
  });

  await sendHtml(email, "You just opened your email!", emailContentAsHtml);
};

const getQueryArgs = (params: APIContext["params"]): { email: string; timestamp: string } => {
  const { email, timestamp } = params;

  if (!email) {
    throw new Error("email is required");
  }

  if (!timestamp) {
    throw new Error("timestamp is required");
  }

  return { email, timestamp };
};

const sendPixel = (): Response =>
  new Response(pixelAsBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store"
    }
  });
