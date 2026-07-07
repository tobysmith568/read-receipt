import axios from "axios";
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

export const getIpFromRequest = (request: Request): string => {
  const env = getEnv();

  if (env.dev.ip) {
    return env.dev.ip;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();

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
