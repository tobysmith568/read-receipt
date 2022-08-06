import axios from "axios";
import { NextApiRequest } from "next";
import requestIp from "request-ip";
import { getEnv } from "./env";

export interface IpResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  isp: string;
  mobile: boolean;
  proxy: boolean;
}

export const getIpFromRequest = (req: NextApiRequest): string => {
  const env = getEnv();

  if (env.dev.ip) {
    return env.dev.ip;
  }

  const ip = requestIp.getClientIp(req);

  if (!ip) {
    throw new Error("Could not get IP address");
  }

  return ip;
};

export const getIpData = async (ip: string): Promise<IpResponse | undefined> => {
  const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,isp,mobile,proxy`;

  const result = await axios.get<IpResponse>(url);

  if (result.status !== 200) {
    return undefined;
  }

  return result.data;
};
