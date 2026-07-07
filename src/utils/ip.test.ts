import { beforeEach, describe, expect, it, mock } from "bun:test";
import { isolatedModuleMock } from "../test-support/isolated-module-mock";
import type { Env, getEnv as GetEnv } from "./env";
import { getIpData, getIpFromRequest } from "./ip";

const non200StatusCodes = [301, 302, 400, 401, 403, 404, 500];

describe("ip utils", () => {
  const mockedGetEnv = isolatedModuleMock("src/utils/env", () => ({
    getEnv: mock<typeof GetEnv>()
  })).getEnv;

  const mockedAxiosGet = isolatedModuleMock("axios", () => ({
    default: { get: mock<(url: string) => Promise<{ status: number; data: unknown }>>() }
  })).default.get;

  const devIp = "123.456.789.0";
  const userIp = "987.654.321.0";

  describe("getIpFromRequest", () => {
    const buildRequest = (forwardedFor?: string): Request =>
      new Request("http://example.com", {
        headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : {}
      });

    beforeEach(() => {
      mockedGetEnv.mockReset();
    });

    it("should return the dev ip when a dev ip is given", () => {
      mockedGetEnv.mockReturnValue({ dev: { ip: devIp } } as Env);

      const result = getIpFromRequest(buildRequest(userIp));

      expect(result).toBe(devIp);
    });

    it("should not return the dev ip when a dev ip is not given", () => {
      mockedGetEnv.mockReturnValue({ dev: { ip: undefined } } as Env);

      const result = getIpFromRequest(buildRequest(userIp));

      expect(result).not.toBe(devIp);
    });

    it("should return the first x-forwarded-for address when a dev ip is not given", () => {
      mockedGetEnv.mockReturnValue({ dev: { isDev: false } } as Env);

      const result = getIpFromRequest(buildRequest(`${userIp}, 1.2.3.4`));

      expect(result).toBe(userIp);
    });

    it("should throw if there is no x-forwarded-for header", () => {
      mockedGetEnv.mockReturnValue({ dev: { isDev: false } } as Env);

      expect(() => getIpFromRequest(buildRequest())).toThrow("Could not get IP address");
    });
  });

  describe("getIpData", () => {
    beforeEach(() => {
      mockedAxiosGet.mockReset();
    });

    it("should make a get request to ip-api.com with the given ip address", async () => {
      mockedAxiosGet.mockResolvedValue({
        status: 200,
        data: {}
      });

      await getIpData(userIp);

      const url = `http://ip-api.com/json/${userIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,isp,mobile,proxy`;
      expect(mockedAxiosGet).toHaveBeenCalledWith(url);
    });

    non200StatusCodes.forEach(non200StatusCode =>
      it(`should return undefined if the request to ip-api.com does not return a 200 status code (${non200StatusCode})`, async () => {
        mockedAxiosGet.mockResolvedValue({
          status: non200StatusCode,
          data: {}
        });

        const result = await getIpData(userIp);

        expect(result).toBeUndefined();
      })
    );

    it("should return the response body if ip-api.com returns a 200 status code", async () => {
      const response = {
        any: "data"
      };

      mockedAxiosGet.mockResolvedValue({
        status: 200,
        data: response
      });

      const result = await getIpData(userIp);

      expect(result).toEqual(response);
    });
  });
});
