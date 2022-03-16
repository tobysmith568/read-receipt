import { Env, getEnv } from "src/utils/env";

describe("env utils", () => {
  let originalEnv: any;

  beforeAll(() => {
    originalEnv = process.env;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getEnv", () => {
    it("should return the populated environment variables", () => {
      process.env.EMAIL_HOST = "email host";
      process.env.EMAIL_PORT = "123";
      process.env.EMAIL_SENDER_NAME = "sender name";
      process.env.EMAIL_SENDER_EMAIL = "sender email";
      process.env.EMAIL_USER = "user";
      process.env.EMAIL_PASS = "pass";
      //process.env.NODE_ENV = "development"; // Omitted because it is read-only
      process.env.DEV_IP = "dev ip";
      process.env.FORCE_HTTP = "true";

      const result = getEnv();

      const expectedEnv: Env = {
        email: {
          host: "email host",
          port: 123,
          senderName: "sender name",
          senderEmail: "sender email",
          user: "user",
          pass: "pass"
        },
        dev: {
          isDev: false,
          ip: "dev ip"
        },
        forceHttp: true
      };

      expect(result).toEqual(expectedEnv);
    });

    it("should return default values when options aren't populated", () => {
      process.env.EMAIL_HOST = "";
      process.env.EMAIL_PORT = "";
      process.env.EMAIL_SENDER_NAME = "";
      process.env.EMAIL_SENDER_EMAIL = "";
      process.env.EMAIL_USER = "";
      process.env.EMAIL_PASS = "";
      //process.env.NODE_ENV = ""; // Omitted because it is read-only
      process.env.DEV_IP = "";
      process.env.FORCE_HTTP = "";

      const result = getEnv();

      const expectedEnv: Env = {
        email: {
          host: "",
          port: 465,
          senderName: "",
          senderEmail: "",
          user: "",
          pass: ""
        },
        dev: {
          isDev: false,
          ip: undefined
        },
        forceHttp: false
      };

      expect(result).toEqual(expectedEnv);
    });

    ["", " ", "0", "1", "false", "True", "anything"].forEach(value =>
      it(`should return forceHttp as false if FORCE_HTTP is any value other than 'true' (${value})`, () => {
        process.env.FORCE_HTTP = value;

        const result = getEnv();

        expect(result.forceHttp).toBe(false);
      })
    );

    it("should return forceHttp as true if FORCE_HTTP is the value 'true'", () => {
      process.env.FORCE_HTTP = "true";

      const result = getEnv();

      expect(result.forceHttp).toBe(true);
    });

    ["", " ", "\t", "\n"].forEach(value =>
      it(`should return the dev.ip as undefined if DEV_IP is falsy or whitespace (${value})`, () => {
        process.env.DEV_IP = value!;

        const result = getEnv();

        expect(result.dev.ip).toBeUndefined();
      })
    );

    ["0", "1", "false", "true", "anything"].forEach(value =>
      it(`should return the dev.ip as DEV_IP if it is truthy and not whitespace (${value})`, () => {
        process.env.DEV_IP = value;

        const result = getEnv();

        expect(result.dev.ip).toBe(value);
      })
    );
  });
});
