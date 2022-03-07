import { NextApiRequest } from "next";

export const getDomainForRequest = (req: NextApiRequest): string => {
  const host = req.headers.host;
  return `https://${host}`;
};
