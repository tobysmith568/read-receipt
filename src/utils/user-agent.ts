import UAParser from "ua-parser-js";

export interface UserAgentDetails {
  browser?: string;
  os?: string;
  platform?: string;
  version?: string;
}

export const getUserAgentData = (request: Request): UserAgentDetails => {
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const userAgentParser = new UAParser(userAgent);

  return {
    browser: userAgentParser.getBrowser().name,
    os: userAgentParser.getOS().name,
    platform: userAgentParser.getDevice().vendor,
    version: userAgentParser.getBrowser().version
  };
};
