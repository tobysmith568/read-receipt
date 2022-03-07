import { NextApiRequest } from "next";
import env from "./env";

export const getDomainForRequest = (req: NextApiRequest): string => {
  const protocol = env.dev.isDev ? "http" : "https";
  const host = req.headers.host;
  return `${protocol}://${host}`;
};
