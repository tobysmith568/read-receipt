import { getDomainForRequest } from "src/utils/domain";
import { type Env, getEnv } from "src/utils/env";

jest.mock("src/utils/env");

describe("domain utils", () => {
  describe("getDomainForRequest", () => {
    const mockedGetEnv = jest.mocked(getEnv);

    const buildRequest = (host: string): Request =>
      new Request("http://example.com", { headers: { host } });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it("should return the http protocol when forceHttp is true", () => {
      mockedGetEnv.mockReturnValue({ forceHttp: true, dev: { isDev: false } } as Env);

      const result = getDomainForRequest(buildRequest("localhost:3000"));

      expect(result.startsWith("http://")).toBe(true);
    });

    it("should return the http protocol when idDev is true", () => {
      mockedGetEnv.mockReturnValue({ forceHttp: false, dev: { isDev: true } } as Env);

      const result = getDomainForRequest(buildRequest("localhost:3000"));

      expect(result.startsWith("http://")).toBe(true);
    });

    it("should return the https protocol when forceHttp and isDev are false", () => {
      mockedGetEnv.mockReturnValue({ forceHttp: false, dev: { isDev: false } } as Env);

      const result = getDomainForRequest(buildRequest("localhost:3000"));

      expect(result.startsWith("https://")).toBe(true);
    });

    ["localhost", "localhost:3000", "github.com", "github.com:433"].forEach(domain => {
      it(`should return the host ${domain}`, () => {
        mockedGetEnv.mockReturnValue({ forceHttp: false, dev: { isDev: false } } as Env);

        const result = getDomainForRequest(buildRequest(domain));

        expect(result.endsWith(domain)).toBe(true);
      });
    });
  });
});
