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
        }
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
        }
      };

      expect(result).toEqual(expectedEnv);
    });
  });
});
