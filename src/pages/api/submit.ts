import type { NextApiRequest, NextApiResponse } from "next";
import { firstEmailAsHtml } from "../../emails/first-email";
import { getDomainForRequest } from "../../utils/domain";
import { sendHtml } from "../../utils/email";
import { getCurrentTimestampUTC } from "../../utils/time";

export interface SubmitRequest {}

export interface SubmitResponse {
  success: boolean;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<SubmitResponse>) => {
  try {
    await handleRequest(req);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
export default handler;

const handleRequest = async (req: NextApiRequest) => {
  const currentDomain = getDomainForRequest(req);

  const recipientEmailAddress = req.body.email;
  const recipientEmailAddressBase64 = encodeURIComponent(recipientEmailAddress);

  const timestamp = getCurrentTimestampUTC();

  const emailContentAsHtml = firstEmailAsHtml({
    domain: currentDomain,
    urlSafeEmail: recipientEmailAddressBase64,
    timestamp
  });

  await sendHtml(recipientEmailAddress, "Read Receipt", emailContentAsHtml);
};
