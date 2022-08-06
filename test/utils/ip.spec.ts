import axios from "axios";
import { NextApiRequest } from "next";
import requestIp from "request-ip";
import { Env, getEnv } from "src/utils/env";
import { getIpData, getIpFromRequest } from "src/utils/ip";

jest.mock("src/utils/env");
jest.mock("request-ip");
jest.mock("axios");

const non200StatusCodes = [301, 302, 400, 401, 403, 404, 500];

describe("ip utils", () => {
  const devIp = "123.456.789.0";
  const userIp = "987.654.321.0";

  describe("getIpFromRequest", () => {
    const mockedGetEnv = jest.mocked(getEnv);
    const mockedRequestIp = jest.mocked(requestIp);

    let request: NextApiRequest;

    beforeEach(() => {
      jest.resetAllMocks();

      request = {} as NextApiRequest;

      mockedRequestIp.getClientIp.mockReturnValue(userIp);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it("should return the dev ip when a dev ip is given", () => {
      mockedGetEnv.mockReturnValue({ dev: { ip: devIp } } as Env);

      const result = getIpFromRequest(request);

      expect(result).toBe(devIp);
    });

    it("should not return the dev ip when a dev ip is not given", () => {
      mockedGetEnv.mockReturnValue({ dev: { ip: undefined } } as Env);

      const result = getIpFromRequest(request);

      expect(result).not.toBe(devIp);
    });

    it("should return the result of request-ip when isDev is false", () => {
      mockedGetEnv.mockReturnValue({ dev: { isDev: false } } as Env);

      const result = getIpFromRequest(request);

      expect(result).toBe(userIp);
    });

    it("should throw if request-ip returns null", () => {
      mockedGetEnv.mockReturnValue({ dev: { isDev: false } } as Env);
      mockedRequestIp.getClientIp.mockReturnValue(null);

      expect(() => getIpFromRequest(request)).toThrow("Could not get IP address");
    });
  });

  describe("getIpData", () => {
    const mockedAxiosGet = jest.mocked(axios.get);

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
