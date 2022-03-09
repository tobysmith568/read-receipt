import { NextApiRequest } from "next";
import { getEnv } from "./env";

export const getDomainForRequest = (req: NextApiRequest): string => {
  const protocol = getEnv().dev.isDev ? "http" : "https";

  const host = req.headers.host;
  return `${protocol}://${host}`;
};
