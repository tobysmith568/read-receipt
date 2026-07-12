import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { firstEmailAsHtml as FirstEmailAsHtml } from "../../emails/first-email";
import { isolatedModuleMock } from "../../test-support/isolated-module-mock";
import type { getDomainForRequest as GetDomainForRequest } from "../../utils/domain";
import type { sendHtml as SendHtml } from "../../utils/email";
import type { Env, getEnv as GetEnv } from "../../utils/env";
import type { getCurrentTimestampUTC as GetCurrentTimestampUTC } from "../../utils/time";
import { POST } from "./submit";

describe("Submit API", () => {
  const mockedFirstEmailAsHtml = isolatedModuleMock("src/emails/first-email", () => ({
    firstEmailAsHtml: mock<typeof FirstEmailAsHtml>()
  })).firstEmailAsHtml;

  const mockedSendHtml = isolatedModuleMock("src/utils/email", () => ({
    sendHtml: mock<typeof SendHtml>()
  })).sendHtml;

  const mockedGetDomainForRequest = isolatedModuleMock("src/utils/domain", () => ({
    getDomainForRequest: mock<typeof GetDomainForRequest>()
  })).getDomainForRequest;

  const mockedGetCurrentTimestampUTC = isolatedModuleMock("src/utils/time", () => ({
    getCurrentTimestampUTC: mock<typeof GetCurrentTimestampUTC>()
  })).getCurrentTimestampUTC;

  const mockedGetEnv = isolatedModuleMock("src/utils/env", () => ({
    getEnv: mock<typeof GetEnv>()
  })).getEnv;

  const emailContent = "This is the email content";
  const requestDomain = "http://example.com";
  const usersEmail = "theUsers@email.address";
  const usersEmailUrlEncoded = "theUsers%40email.address";
  const currentTimeStamp = 1234567890;

  const buildEnv = (isDev: boolean): Env => ({
    email: { host: "", port: 465, senderName: "", senderEmail: "", user: "", pass: "" },
    dev: { isDev },
    forceHttp: false
  });

  beforeEach(() => {
    mockedFirstEmailAsHtml.mockReset().mockReturnValue(emailContent);
    mockedSendHtml.mockReset().mockResolvedValue(undefined);
    mockedGetDomainForRequest.mockReset().mockReturnValue(requestDomain);
    mockedGetCurrentTimestampUTC.mockReset().mockReturnValue(currentTimeStamp);
    mockedGetEnv.mockReset().mockReturnValue(buildEnv(false));
  });

  const buildRequest = (email: string): Request =>
    new Request("http://example.com/api/submit", {
      method: "POST",
      body: JSON.stringify({ email })
    });

  const makeContext = (request: Request) => ({ request }) as Parameters<typeof POST>[0];

  it("should create the first email with the correct props", async () => {
    await POST(makeContext(buildRequest(usersEmail)));

    expect(mockedFirstEmailAsHtml).toHaveBeenCalledTimes(1);
    expect(mockedFirstEmailAsHtml).toHaveBeenCalledWith({
      domain: requestDomain,
      urlSafeEmail: usersEmailUrlEncoded,
      timestamp: currentTimeStamp
    });
  });

  it("should send the first email to the user", async () => {
    await POST(makeContext(buildRequest(usersEmail)));

    expect(mockedSendHtml).toHaveBeenCalledTimes(1);
    expect(mockedSendHtml).toHaveBeenCalledWith(usersEmail, "Read Receipt", emailContent);
  });

  it("should return a 200 status if the email successfully sends", async () => {
    const response = await POST(makeContext(buildRequest(usersEmail)));

    expect(response.status).toBe(200);
  });

  it("should return success as true if the email successfully sends", async () => {
    const response = await POST(makeContext(buildRequest(usersEmail)));

    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("should return a 500 status if the email fails to send", async () => {
    mockedSendHtml.mockRejectedValue("anything");

    const response = await POST(makeContext(buildRequest(usersEmail)));

    expect(response.status).toBe(500);
  });

  it("should return success as false if the email successfully fails to send", async () => {
    mockedSendHtml.mockRejectedValue("anything");

    const response = await POST(makeContext(buildRequest(usersEmail)));

    await expect(response.json()).resolves.toEqual({ success: false });
  });

  it("should not include error details when not in dev mode", async () => {
    mockedGetEnv.mockReturnValue(buildEnv(false));
    mockedSendHtml.mockRejectedValue(new Error("SMTP connection refused"));

    const response = await POST(makeContext(buildRequest(usersEmail)));

    await expect(response.json()).resolves.toEqual({ success: false });
  });

  it("should include the error message when in dev mode and the error is an Error", async () => {
    mockedGetEnv.mockReturnValue(buildEnv(true));
    mockedSendHtml.mockRejectedValue(new Error("SMTP connection refused"));

    const response = await POST(makeContext(buildRequest(usersEmail)));

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "SMTP connection refused"
    });
  });

  it("should stringify the thrown value when in dev mode and the error is not an Error", async () => {
    mockedGetEnv.mockReturnValue(buildEnv(true));
    mockedSendHtml.mockRejectedValue("anything");

    const response = await POST(makeContext(buildRequest(usersEmail)));

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "anything"
    });
  });
});
