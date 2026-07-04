import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { secondEmailAsHtml as SecondEmailAsHtml } from "../../../../emails/second-email";
import { isolatedModuleMock } from "../../../../test-support/isolated-module-mock";
import type { getDomainForRequest as GetDomainForRequest } from "../../../../utils/domain";
import type { sendHtml as SendHtml } from "../../../../utils/email";
import type {
  getIpData as GetIpData,
  getIpFromRequest as GetIpFromRequest,
  IpResponse
} from "../../../../utils/ip";
import type {
  getCurrentTimestampUTC as GetCurrentTimestampUTC,
  getDifferenceBetweenTimestamps as GetDifferenceBetweenTimestamps,
  printTimestamp as PrintTimestamp
} from "../../../../utils/time";
import type { getUserAgentData as GetUserAgentData } from "../../../../utils/user-agent";
import { GET } from "./[timestamp]";

describe("Submit API", () => {
  const mockedSecondEmailAsHtml = isolatedModuleMock("src/emails/second-email", () => ({
    secondEmailAsHtml: mock<typeof SecondEmailAsHtml>()
  })).secondEmailAsHtml;

  const mockedGetDomainForRequest = isolatedModuleMock("src/utils/domain", () => ({
    getDomainForRequest: mock<typeof GetDomainForRequest>()
  })).getDomainForRequest;

  const mockedTime = isolatedModuleMock("src/utils/time", () => ({
    getCurrentTimestampUTC: mock<typeof GetCurrentTimestampUTC>(),
    printTimestamp: mock<typeof PrintTimestamp>(),
    getDifferenceBetweenTimestamps: mock<typeof GetDifferenceBetweenTimestamps>()
  }));
  const mockedGetCurrentTimestampUTC = mockedTime.getCurrentTimestampUTC;
  const mockedPrintTimestamp = mockedTime.printTimestamp;
  const mockedGetDifferenceBetweenTimestamps = mockedTime.getDifferenceBetweenTimestamps;

  const mockedSendHtml = isolatedModuleMock("src/utils/email", () => ({
    sendHtml: mock<typeof SendHtml>()
  })).sendHtml;

  const mockedIp = isolatedModuleMock("src/utils/ip", () => ({
    getIpData: mock<typeof GetIpData>(),
    getIpFromRequest: mock<typeof GetIpFromRequest>()
  }));
  const mockedGetIpData = mockedIp.getIpData;
  const mockedGetIpFromRequest = mockedIp.getIpFromRequest;

  const mockedGetUserAgentData = isolatedModuleMock("src/utils/user-agent", () => ({
    getUserAgentData: mock<typeof GetUserAgentData>()
  })).getUserAgentData;

  const requestDomain = "http://example.com";
  const emailContent = "This is the email content";
  const usersEmail = "theUsers@email.address";
  const usersIpAddress = "123.456.789.0";
  const timeStampOfFirstEmail = 12345;
  const timeStampOfFirstEmailFormatted = "4:25:45am, 1 January 1970 UTC";
  const currentTimeStamp = 67890;
  const timeStampOfSecondEmailFormatted = "7:51:30pm, 1 January 1970 UTC";
  const differenceBetweenEmails = "0 days, 15 hours, 25 minutes, and 45 seconds";
  const usersIpData: IpResponse = {
    city: "London"
  } as IpResponse;
  const trackingPixelAsBuffer = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0,
    0, 0, 144, 119, 83, 222, 0, 0, 0, 1, 115, 82, 71, 66, 0, 174, 206, 28, 233, 0, 0, 0, 4, 103, 65,
    77, 65, 0, 0, 177, 143, 11, 252, 97, 5, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 14, 195, 0, 0, 14,
    195, 1, 199, 111, 168, 100, 0, 0, 0, 12, 73, 68, 65, 84, 24, 87, 99, 248, 255, 255, 63, 0, 5,
    254, 2, 254, 167, 53, 129, 132, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
  ]);

  const request = new Request("http://example.com/api/open/a/1");

  const makeContext = (email?: string, timestamp?: string) =>
    ({ request, params: { email, timestamp } }) as Parameters<typeof GET>[0];

  beforeEach(() => {
    mockedSecondEmailAsHtml.mockReset().mockReturnValue(emailContent);

    mockedPrintTimestamp
      .mockReset()
      .mockImplementation(timestamp =>
        timestamp === timeStampOfFirstEmail
          ? timeStampOfFirstEmailFormatted
          : timeStampOfSecondEmailFormatted
      );

    mockedGetDomainForRequest.mockReset().mockReturnValue(requestDomain);
    mockedGetCurrentTimestampUTC.mockReset().mockReturnValue(currentTimeStamp);
    mockedGetDifferenceBetweenTimestamps.mockReset().mockReturnValue(differenceBetweenEmails);
    mockedSendHtml.mockReset().mockResolvedValue(undefined);
    mockedGetIpFromRequest.mockReset().mockReturnValue(usersIpAddress);
    mockedGetUserAgentData.mockReset().mockReturnValue({
      browser: "Chrome",
      os: "Windows",
      platform: "Windows",
      version: "99.0.4844.51"
    });
    mockedGetIpData.mockReset().mockResolvedValue(usersIpData);
  });

  it("should calculate the time difference between the two emails", async () => {
    await GET(makeContext(usersEmail, timeStampOfFirstEmail.toString()));

    expect(mockedGetDifferenceBetweenTimestamps).toHaveBeenCalledTimes(1);
    expect(mockedGetDifferenceBetweenTimestamps).toHaveBeenCalledWith(
      timeStampOfFirstEmail,
      currentTimeStamp
    );
  });

  it("should fetch the Ip data for the user's Ip address", async () => {
    await GET(makeContext(usersEmail, timeStampOfFirstEmail.toString()));

    expect(mockedGetIpData).toHaveBeenCalledTimes(1);
    expect(mockedGetIpData).toHaveBeenCalledWith(usersIpAddress);
  });

  it("should fetch the user agent data for the user's browser", async () => {
    await GET(makeContext(usersEmail, timeStampOfFirstEmail.toString()));

    expect(mockedGetUserAgentData).toHaveBeenCalledTimes(1);
    expect(mockedGetUserAgentData).toHaveBeenCalledWith(request);
  });

  it("should create the second email with the correct props", async () => {
    await GET(makeContext(usersEmail, timeStampOfFirstEmail.toString()));

    expect(mockedSecondEmailAsHtml).toHaveBeenCalledTimes(1);
    expect(mockedSecondEmailAsHtml).toHaveBeenCalledWith({
      domain: "http://example.com",
      ipData: {
        city: "London"
      },
      times: {
        firstEmailTimestamp: timeStampOfFirstEmailFormatted,
        secondEmailTimestamp: timeStampOfSecondEmailFormatted,
        timestampDifference: differenceBetweenEmails
      },
      user: {
        email: "theUsers@email.address",
        ip: "123.456.789.0"
      },
      userAgentData: {
        browser: "Chrome",
        os: "Windows",
        platform: "Windows",
        version: "99.0.4844.51"
      }
    });
  });

  it("should send the second email to the user", async () => {
    await GET(makeContext(usersEmail, timeStampOfFirstEmail.toString()));

    expect(mockedSendHtml).toHaveBeenCalledTimes(1);
    expect(mockedSendHtml).toHaveBeenCalledWith(
      usersEmail,
      "You just opened your email!",
      emailContent
    );
  });

  it("should return the tracking pixel", async () => {
    const response = await GET(makeContext(usersEmail, timeStampOfFirstEmail.toString()));

    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.arrayBuffer()).resolves.toEqual(
      trackingPixelAsBuffer.buffer.slice(
        trackingPixelAsBuffer.byteOffset,
        trackingPixelAsBuffer.byteOffset + trackingPixelAsBuffer.byteLength
      )
    );
  });

  it("should still return the tracking pixel if there is no email", async () => {
    const response = await GET(makeContext(undefined, timeStampOfFirstEmail.toString()));

    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("should still return the tracking pixel if there is no timestamp", async () => {
    const response = await GET(makeContext(usersEmail, undefined));

    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("should still return the tracking pixel if the timestamps cannot be parsed as a number", async () => {
    const response = await GET(makeContext(usersEmail, "not a valid number"));

    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
