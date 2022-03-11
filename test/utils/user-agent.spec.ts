import { NextApiRequest } from "next";
import { getUserAgentData } from "src/utils/user-agent";

describe("user-agent utils", () => {
  let userAgentGetter: jest.SpyInstance<string, []>;

  beforeAll(() => {
    userAgentGetter = jest.spyOn(window.navigator, "userAgent", "get");
    userAgentGetter.mockReturnValue(undefined!);
  });

  afterAll(() => {
    userAgentGetter.mockRestore();
  });

  describe("getUserAgentData", () => {
    [
      {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0",
        result: { browser: "Firefox", os: "Windows", platform: undefined, version: "57.0" }
      },
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36",
        result: { browser: "Chrome", os: "Windows", platform: undefined, version: "63.0.3239.84" }
      },
      {
        userAgent:
          "Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36",
        result: { browser: "Chrome", os: "Android", platform: "Samsung", version: "59.0.3071.125" }
      },
      {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 6_1_4 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B350 Safari/8536.25",
        result: { browser: "Mobile Safari", os: "iOS", platform: "Apple", version: "6.0" }
      },
      {
        userAgent:
          "Mozilla/5.0 (Linux; U; Android 5.1; locale; device Build/build) AppleWebKit/webkit (KHTML, like Gecko) Version/4.0 Chrome/chrome Safari/safari",
        result: { browser: "Android Browser", os: "Android", platform: undefined, version: "4.0" }
      },
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36 Edg/81.0.416.72",
        result: { browser: "Edge", os: "Windows", platform: undefined, version: "81.0.416.72" }
      },
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36 OPR/69.0.3686.68",
        result: { browser: "Opera", os: "Windows", platform: undefined, version: "69.0.3686.68" }
      }
    ].forEach(testCase =>
      it("should return the user agent data", () => {
        const req: NextApiRequest = {
          headers: {
            "user-agent": testCase.userAgent
          }
        } as NextApiRequest;

        const result = getUserAgentData(req);

        expect(result).toEqual(testCase.result);
      })
    );

    it("should return undefined values if the user agent is not defined", () => {
      const req: NextApiRequest = {
        headers: {}
      } as NextApiRequest;

      const result = getUserAgentData(req);

      expect(result).toStrictEqual({
        browser: undefined,
        os: undefined,
        platform: undefined,
        version: undefined
      });
    });

    it("should return undefined values if they cannot be gotten from the user agent", () => {
      const req: NextApiRequest = {
        headers: {
          "user-agent": "Not a user agent"
        }
      } as NextApiRequest;

      const result = getUserAgentData(req);

      expect(result).toStrictEqual({
        browser: undefined,
        os: undefined,
        platform: undefined,
        version: undefined
      });
    });
  });
});
