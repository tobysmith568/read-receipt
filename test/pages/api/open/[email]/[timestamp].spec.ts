import { when } from "jest-when";
import { NextApiRequest, NextApiResponse } from "next";
import { secondEmailAsHtml } from "src/emails/second-email";
import emailReadApiHandler from "src/pages/api/open/[email]/[timestamp]";
import { getDomainForRequest } from "src/utils/domain";
import { sendHtml } from "src/utils/email";
import { getIpData, getIpFromRequest, IpResponse } from "src/utils/ip";
import {
  getCurrentTimestampUTC,
  getDifferenceBetweenTimestamps,
  printTimestamp
} from "src/utils/time";
import { getUserAgentData } from "src/utils/user-agent";

jest.mock("src/emails/second-email");
const mockedSecondEmailAsHtml = jest.mocked(secondEmailAsHtml);

jest.mock("src/utils/domain");
const mockedGetDomainForRequest = jest.mocked(getDomainForRequest);

jest.mock("src/utils/time");
const mockedGetCurrentTimestampUTC = jest.mocked(getCurrentTimestampUTC);
const mockedPrintTimestamp = jest.mocked(printTimestamp);
const mockedGetDifferenceBetweenTimestamps = jest.mocked(getDifferenceBetweenTimestamps);

jest.mock("src/utils/email");
const mockedSendHtml = jest.mocked(sendHtml);

jest.mock("src/utils/ip");
const mockedGetIpData = jest.mocked(getIpData);
const mockedGetIpFromRequest = jest.mocked(getIpFromRequest);

jest.mock("src/utils/user-agent");
const mockedGetUserAgentData = jest.mocked(getUserAgentData);

describe("Submit API", () => {
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

  let req: NextApiRequest;
  let res: NextApiResponse<Buffer>;

  let resSetHeader = jest.fn();
  let resSend = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    mockedSecondEmailAsHtml.mockReturnValue(emailContent);

    when(mockedPrintTimestamp)
      .calledWith(timeStampOfFirstEmail)
      .mockReturnValue(timeStampOfFirstEmailFormatted);
    when(mockedPrintTimestamp)
      .calledWith(currentTimeStamp)
      .mockReturnValue(timeStampOfSecondEmailFormatted);

    req = {} as NextApiRequest;
    res = {} as NextApiResponse<Buffer>;

    resSetHeader = jest.fn(() => res);
    res.setHeader = resSetHeader;

    resSend = jest.fn(() => res);
    res.send = resSend;

    mockedGetDomainForRequest.mockReturnValue(requestDomain);
    mockedGetCurrentTimestampUTC.mockReturnValue(currentTimeStamp);
    mockedGetDifferenceBetweenTimestamps.mockReturnValue(differenceBetweenEmails);
    mockedGetIpFromRequest.mockReturnValue(usersIpAddress);
    mockedGetUserAgentData.mockReturnValue({
      browser: "Chrome",
      os: "Windows",
      platform: "Windows",
      version: "99.0.4844.51"
    });
    mockedGetIpData.mockResolvedValue(usersIpData);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should calculate the time difference between the two emails", async () => {
    req.query = {
      email: usersEmail,
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

    expect(mockedGetDifferenceBetweenTimestamps).toHaveBeenCalledTimes(1);
    expect(mockedGetDifferenceBetweenTimestamps).toHaveBeenCalledWith(
      timeStampOfFirstEmail,
      currentTimeStamp
    );
  });

  it("should fetch the Ip data for the user's Ip address", async () => {
    req.query = {
      email: usersEmail,
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

    expect(mockedGetIpData).toHaveBeenCalledTimes(1);
    expect(mockedGetIpData).toHaveBeenCalledWith(usersIpAddress);
  });

  it("should fetch the user agent data for the user's browser", async () => {
    req.query = {
      email: usersEmail,
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

    expect(mockedGetUserAgentData).toHaveBeenCalledTimes(1);
    expect(mockedGetUserAgentData).toHaveBeenCalledWith(req);
  });

  it("should create the second email with the correct props", async () => {
    req.query = {
      email: usersEmail,
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

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
    req.query = {
      email: usersEmail,
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

    expect(mockedSendHtml).toHaveBeenCalledTimes(1);
    expect(mockedSendHtml).toHaveBeenCalledWith(
      usersEmail,
      "You just opened your email!",
      emailContent
    );
  });

  it("should return the tracking pixel", async () => {
    req.query = {
      email: usersEmail,
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

    expect(resSetHeader).toHaveBeenCalledTimes(2);
    expect(resSetHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(resSetHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(resSend).toHaveBeenCalledWith(trackingPixelAsBuffer);
  });

  it("should still return the tracking pixel if there is no email", async () => {
    req.query = {
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

    expect(resSetHeader).toHaveBeenCalledTimes(2);
    expect(resSetHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(resSetHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(resSend).toHaveBeenCalledWith(trackingPixelAsBuffer);
  });

  it("should still return the tracking pixel if there are multiple emails", async () => {
    req.query = {
      email: [usersEmail, "another@email.com"],
      timestamp: timeStampOfFirstEmail.toString()
    };

    await emailReadApiHandler(req, res);

    expect(resSetHeader).toHaveBeenCalledTimes(2);
    expect(resSetHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(resSetHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(resSend).toHaveBeenCalledWith(trackingPixelAsBuffer);
  });

  it("should still return the tracking pixel if there is no timestamp", async () => {
    req.query = {
      email: usersEmail
    };

    await emailReadApiHandler(req, res);

    expect(resSetHeader).toHaveBeenCalledTimes(2);
    expect(resSetHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(resSetHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(resSend).toHaveBeenCalledWith(trackingPixelAsBuffer);
  });

  it("should still return the tracking pixel if there are multiple timestamps", async () => {
    req.query = {
      email: usersEmail,
      timestamp: [timeStampOfFirstEmail.toString(), "123"]
    };

    await emailReadApiHandler(req, res);

    expect(resSetHeader).toHaveBeenCalledTimes(2);
    expect(resSetHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(resSetHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(resSend).toHaveBeenCalledWith(trackingPixelAsBuffer);
  });

  it("should still return the tracking pixel if the timestamps cannot be parsed as a number", async () => {
    req.query = {
      email: usersEmail,
      timestamp: "not a valid number"
    };

    await emailReadApiHandler(req, res);

    expect(resSetHeader).toHaveBeenCalledTimes(2);
    expect(resSetHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(resSetHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(resSend).toHaveBeenCalledWith(trackingPixelAsBuffer);
  });
});
