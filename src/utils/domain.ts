import { getEnv } from "./env";

export const getDomainForRequest = (request: Request): string => {
  const env = getEnv();

  const protocol = env.dev.isDev || env.forceHttp ? "http" : "https";

  const host = request.headers.get("host");
  return `${protocol}://${host}`;
};
