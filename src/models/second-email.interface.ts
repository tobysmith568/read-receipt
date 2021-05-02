import { IIPResponse } from "src/services/ip.service";
import { IUserAgentDetails } from "src/services/user-agent.service";

export interface ISecondEmail {
  user: {
    email: string;
    ip: string;
  };
  times: {
    firstEmailTimestamp: string;
    secondEmailTimestamp: string;
    timestampDifference: string;
  };
  ipData?: IIPResponse;
  userAgentData?: IUserAgentDetails;
}
