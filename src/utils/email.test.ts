import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Transporter } from "nodemailer";
import { isolatedModuleMock } from "../test-support/isolated-module-mock";
import { sendHtml } from "./email";
import type { Env, getEnv as GetEnv } from "./env";

describe("email", () => {
  const mockedGetEnv = isolatedModuleMock("src/utils/env", () => ({
    getEnv: mock<typeof GetEnv>()
  })).getEnv;

  const mockedCreateTransport = isolatedModuleMock("nodemailer", () => ({
    createTransport: mock<(...args: unknown[]) => Transporter<unknown>>()
  })).createTransport;

  let host = "";
  let port = 0;
  let user = "";
  let pass = "";
  let senderName = "";
  let senderEmail = "";

  let to = "";
  let subject = "";
  let html = "";

  beforeEach(() => {
    mockedGetEnv.mockReset();
    mockedCreateTransport.mockReset();

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

    mockedCreateTransport.mockReturnValue({
      sendMail: mock().mockResolvedValue(undefined)
    } as unknown as Transporter);
  });

  describe("sendHtml", () => {
    it("should create a transport with the host", async () => {
      await sendHtml(to, subject, html);

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].host).toBe(host);
    });

    it("should create a transport with the port", async () => {
      await sendHtml(to, subject, html);

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].port).toBe(port);
    });

    it("should create a transport with the secure flag set to true when the port is 465", async () => {
      await sendHtml(to, subject, html);

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].secure).toBe(true);
    });

    it("should create a transport with the secure flag set to false when the port is not 465", async () => {
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

      await sendHtml(to, subject, html);

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].secure).toBe(false);
    });

    it("should create a transport with the user", async () => {
      await sendHtml(to, subject, html);

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].auth.user).toBe(user);
    });

    it("should create a transport with the pass", async () => {
      await sendHtml(to, subject, html);

      const args = mockedCreateTransport.mock.calls[0] as any;
      expect(args[0].auth.pass).toBe(pass);
    });

    it("should pass the recipient to the mail transport", async () => {
      const sendMailMock = mock();
      mockedCreateTransport.mockReturnValue({ sendMail: sendMailMock } as unknown as Transporter);

      await sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].to).toBe(to);
    });

    it("should pass the subject to the mail transport", async () => {
      const sendMailMock = mock();
      mockedCreateTransport.mockReturnValue({ sendMail: sendMailMock } as unknown as Transporter);

      await sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].subject).toBe(subject);
    });

    it("should pass the html to the mail transport", async () => {
      const sendMailMock = mock();
      mockedCreateTransport.mockReturnValue({ sendMail: sendMailMock } as unknown as Transporter);

      await sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].html).toBe(html);
    });

    it("should pass the formatted from to the mail transport", async () => {
      const sendMailMock = mock();
      mockedCreateTransport.mockReturnValue({ sendMail: sendMailMock } as unknown as Transporter);

      await sendHtml(to, subject, html);

      const args = sendMailMock.mock.calls[0];
      expect(args[0].from).toBe(`${senderName} <${senderEmail}>`);
    });
  });
});
