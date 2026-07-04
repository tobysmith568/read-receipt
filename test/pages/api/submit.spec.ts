import { firstEmailAsHtml } from "src/emails/first-email";
import { POST } from "src/pages/api/submit";
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

  beforeEach(() => {
    jest.resetAllMocks();

    mockedFirstEmailAsHtml.mockReturnValue(emailContent);

    mockedGetDomainForRequest.mockReturnValue(requestDomain);
    mockedGetCurrentTimestampUTC.mockReturnValue(currentTimeStamp);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const buildRequest = (email: string): Request =>
    new Request("http://example.com/api/submit", {
      method: "POST",
      body: JSON.stringify({ email })
    });

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
});

const makeContext = (request: Request) => ({ request }) as Parameters<typeof POST>[0];
