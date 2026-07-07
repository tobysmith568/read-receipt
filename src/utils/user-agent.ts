import { UAParser } from "@ua-parser-js/pro-personal";

export interface UserAgentDetails {
  browser?: string;
  os?: string;
  platform?: string;
  version?: string;
}

export const getUserAgentData = (request: Request): UserAgentDetails => {
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const { browser, os, device } = UAParser(userAgent);

  return {
    browser: browser.name,
    os: os.name,
    platform: device.vendor,
    version: browser.version
  };
};
