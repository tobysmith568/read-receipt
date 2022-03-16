import { NextApiRequest } from "next";
import { getEnv } from "./env";

export const getDomainForRequest = (req: NextApiRequest): string => {
  const env = getEnv();

  const protocol = env.dev.isDev || env.forceHttp ? "http" : "https";

  const host = req.headers.host;
  return `${protocol}://${host}`;
};
