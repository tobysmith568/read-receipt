import { NextApiRequest, NextApiResponse } from "next";
import { firstEmailAsHtml } from "src/emails/first-email";
import submitApiHandler, { SubmitResponse } from "src/pages/api/submit";
import { getDomainForRequest } from "src/utils/domain";
import { sendHtml } from "src/utils/email";
import { getCurrentTimestampUTC } from "src/utils/time";

jest.mock("src/emails/first-email");
const mockedFirstEmailAsHtml = jest.mocked(firstEmailAsHtml);

jest.mock("src/utils/email");
const mockedSendHtml = jest.mocked(sendHtml);

jest.mock("src/utils/domain");
const mockedGetDomainForRequest = jest.mocked(getDomainForRequest);

jest.mock("src/utils/time");
const mockedGetCurrentTimestampUTC = jest.mocked(getCurrentTimestampUTC);

describe("Submit API", () => {
  const emailContent = "This is the email content";
  const requestDomain = "http://example.com";
  const usersEmail = "theUsers@email.address";
  const usersEmailUrlEncoded = "theUsers%40email.address";
  const currentTimeStamp = 1234567890;

  let req: NextApiRequest;
  let res: NextApiResponse<SubmitResponse>;

  let resStatus = jest.fn();
  let resJson = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    mockedFirstEmailAsHtml.mockReturnValue(emailContent);

    req = {} as NextApiRequest;
    res = {} as NextApiResponse<SubmitResponse>;

    resStatus = jest.fn(() => res);
    res.status = resStatus;

    resJson = jest.fn(() => res);
    res.json = resJson;

    mockedGetDomainForRequest.mockReturnValue(requestDomain);
    mockedGetCurrentTimestampUTC.mockReturnValue(currentTimeStamp);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should create the first email with the correct props", async () => {
    req.body = {
      email: usersEmail
    };

    await submitApiHandler(req, res);

    expect(mockedFirstEmailAsHtml).toHaveBeenCalledTimes(1);
    expect(mockedFirstEmailAsHtml).toHaveBeenCalledWith({
      domain: requestDomain,
      urlSafeEmail: usersEmailUrlEncoded,
      timestamp: currentTimeStamp
    });
  });

  it("should send the first email to the user", async () => {
    req.body = {
      email: usersEmail
    };

    await submitApiHandler(req, res);

    expect(mockedSendHtml).toHaveBeenCalledTimes(1);
    expect(mockedSendHtml).toHaveBeenCalledWith(usersEmail, "Read Receipt", emailContent);
  });

  it("should return a 200 status if the email successfully sends", async () => {
    req.body = {
      email: usersEmail
    };

    await submitApiHandler(req, res);

    expect(resStatus).toHaveBeenCalledTimes(1);
    expect(resStatus).toHaveBeenCalledWith(200);
  });

  it("should return success as true if the email successfully sends", async () => {
    req.body = {
      email: usersEmail
    };

    await submitApiHandler(req, res);

    expect(resJson).toHaveBeenCalledTimes(1);
    expect(resJson).toHaveBeenCalledWith({ success: true });
  });

  it("should return a 500 status if the email fails to send", async () => {
    req.body = {
      email: usersEmail
    };

    mockedSendHtml.mockRejectedValue("anything");

    await submitApiHandler(req, res);

    expect(resStatus).toHaveBeenCalledTimes(1);
    expect(resStatus).toHaveBeenCalledWith(500);
  });

  it("should return success as false if the email successfully fails to send", async () => {
    req.body = {
      email: usersEmail
    };

    mockedSendHtml.mockRejectedValue("anything");

    await submitApiHandler(req, res);

    expect(resJson).toHaveBeenCalledTimes(1);
    expect(resJson).toHaveBeenCalledWith({ success: false });
  });
});
