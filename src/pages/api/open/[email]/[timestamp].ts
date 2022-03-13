import { NextApiRequest, NextApiResponse } from "next";
import { secondEmailAsHtml, Times, User } from "src/emails/second-email";
import { getDomainForRequest } from "src/utils/domain";
import { sendHtml } from "src/utils/email";
import { getIpData, getIpFromRequest } from "src/utils/ip";
import {
  getCurrentTimestampUTC,
  getDifferenceBetweenTimestamps,
  printTimestamp
} from "src/utils/time";
import { getUserAgentData } from "src/utils/user-agent";

const base64pixel =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII=";

const pixelAsBuffer = Buffer.from(base64pixel, "base64");

const handler = async (req: NextApiRequest, res: NextApiResponse<Buffer>) => {
  try {
    await handleRequest(req);
  } catch {
    // empty
  }

  sendPixel(res);
};
export default handler;

const handleRequest = async (req: NextApiRequest) => {
  const { email, timestamp } = getQueryArgs(req);
  const currentDomain = getDomainForRequest(req);
  const currentTimestamp = getCurrentTimestampUTC();

  const times: Times = {
    firstEmailTimestamp: printTimestamp(Number(timestamp)),
    secondEmailTimestamp: printTimestamp(currentTimestamp),
    timestampDifference: getDifferenceBetweenTimestamps(Number(timestamp), currentTimestamp)
  };

  const ip = getIpFromRequest(req);

  const user: User = {
    email,
    ip
  };

  const ipData = await getIpData(ip);
  const userAgentData = getUserAgentData(req);

  const emailContentAsHtml = secondEmailAsHtml({
    domain: currentDomain,
    times,
    user,
    ipData,
    userAgentData
  });

  await sendHtml(email, "You just opened your email!", emailContentAsHtml);
};

const getQueryArgs = (req: NextApiRequest): { email: string; timestamp: string } => {
  const { email, timestamp } = req.query;

  if (!email) {
    throw new Error("email is required");
  }
  if (typeof email !== "string") {
    throw new Error("You can only submit one email");
  }

  if (!timestamp) {
    throw new Error("timestamp is required");
  }
  if (typeof timestamp !== "string") {
    throw new Error("You can only submit one timestamp");
  }

  return { email, timestamp };
};

const sendPixel = (res: NextApiResponse<Buffer>) => {
  res
    .setHeader("Content-Type", "image/png")
    .setHeader("Cache-Control", "no-store")
    .send(pixelAsBuffer);
};
