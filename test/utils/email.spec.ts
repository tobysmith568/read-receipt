import { createTransport, Transporter } from "nodemailer";
import { Env, getEnv } from "src/utils/env";

jest.mock("src/utils/env");
jest.mock("nodemailer");

describe("email", () => {
  let host = "";
  let port = 0;
  let user = "";
  let pass = "";
  let senderName = "";
  let senderEmail = "";

  let to = "";
  let subject = "";
  let html = "";

  let mockedCreateTransport = jest.mocked(createTransport);
  let mockedGetEnv = jest.mocked(getEnv);

  beforeEach(() => {
    jest.resetAllMocks();

    to = "recipient@server.com";
    subject = "This is the subject";
    html = "<h1>This is the email</h1>";

    host = "host";
    port = 465;
    user = "user";
    pass = "pass";
    senderName = "senderName";
    senderEmail = "senderEmail";

    mockedGetEnv.mockReturnValue({
      email: {
        host,
        port,
        user,
        pass,
        senderName,
        senderEmail
      }
    } as Env);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("when the module is imported", () => {
    it("should create a transport with the host", () => {
      jest.isolateModules(() => {
        require("src/utils/email");
      });

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].host).toBe(host);
    });

    it("should create a transport with the port", () => {
      jest.isolateModules(() => {
        require("src/utils/email");
      });

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].port).toBe(port);
    });

    it("should create a transport with the secure flag set to true when the port is 465", () => {
      jest.isolateModules(() => {
        require("src/utils/email");
      });

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].secure).toBe(true);
    });

    it("should create a transport with the secure flag set to false when the port is not 465", () => {
      mockedGetEnv.mockReturnValue({
        email: {
          host,
          port: 123,
          user,
          pass,
          senderName,
          senderEmail
        }
      } as Env);

      jest.isolateModules(() => {
        require("src/utils/email");
      });

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].secure).toBe(false);
    });

    it("should create a transport with the user", () => {
      jest.isolateModules(() => {
        require("src/utils/email");
      });

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].auth.user).toBe(user);
    });

    it("should create a transport with the pass", () => {
      jest.isolateModules(() => {
        require("src/utils/email");
      });

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].auth.pass).toBe(pass);
    });
  });

  describe("sendHtml", () => {
    it("should pass the recipient to the mail transport", async () => {
      const sendMailMock = jest.fn();

      mockedCreateTransport.mockReturnValue({
        sendMail: sendMailMock
      } as unknown as Transporter<unknown>);

      let emailModule: any;
      jest.isolateModules(() => {
        emailModule = require("src/utils/email");
      });

      await emailModule.sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].to).toBe(to);
    });

    it("should pass the subject to the mail transport", async () => {
      const sendMailMock = jest.fn();

      mockedCreateTransport.mockReturnValue({
        sendMail: sendMailMock
      } as unknown as Transporter<unknown>);

      let emailModule: any;
      jest.isolateModules(() => {
        emailModule = require("src/utils/email");
      });

      await emailModule.sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].subject).toBe(subject);
    });

    it("should pass the html to the mail transport", async () => {
      const sendMailMock = jest.fn();

      mockedCreateTransport.mockReturnValue({
        sendMail: sendMailMock
      } as unknown as Transporter<unknown>);

      let emailModule: any;
      jest.isolateModules(() => {
        emailModule = require("src/utils/email");
      });

      await emailModule.sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].html).toBe(html);
    });

    it("should pass the formatted from to the mail transport", async () => {
      const sendMailMock = jest.fn();

      mockedCreateTransport.mockReturnValue({
        sendMail: sendMailMock
      } as unknown as Transporter<unknown>);

      let emailModule: any;
      jest.isolateModules(() => {
        emailModule = require("src/utils/email");
      });

      await emailModule.sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].from).toBe(`${senderName} <${senderEmail}>`);
    });
  });
});
