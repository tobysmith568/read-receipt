import { singleton } from "tsyringe";
import { Request } from "express";

@singleton()
export class UserAgentService {
  public getUserAgent(req: Request): IUserAgentDetails | undefined {
    const agentDetails = req.useragent;

    if (!agentDetails) {
      return undefined;
    }

    return {
      browser: agentDetails.browser,
      os: agentDetails.os,
      platform: agentDetails.platform,
      version: agentDetails.version
    };
  }
}

export interface IUserAgentDetails {
  browser: string;
  os: string;
  platform: string;
  version: string;
}
