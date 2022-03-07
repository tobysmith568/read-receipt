import { NextApiRequest } from "next";
import UAParser from "ua-parser-js";

export interface UserAgentDetails {
  browser?: string;
  os?: string;
  platform?: string;
  version?: string;
}

export const getUserAgentData = (req: NextApiRequest): UserAgentDetails => {
  const userAgent = req.headers["user-agent"];

  const userAgentParser = new UAParser(userAgent);

  return {
    browser: userAgentParser.getBrowser().name,
    os: userAgentParser.getOS().name,
    platform: userAgentParser.getDevice().vendor,
    version: userAgentParser.getBrowser().version
  };
};
