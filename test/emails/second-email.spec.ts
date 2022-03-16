import { secondEmailAsHtml, SecondEmailProps } from "../../src/emails/second-email";

describe("second email", () => {
  let props: SecondEmailProps;

  beforeEach(() => {
    props = {
      domain: "https://wherever.this.is.hosted",
      user: {
        email: "this.is.a.email.address@mail.com",
        ip: "123.456.789.0"
      },
      times: {
        firstEmailTimestamp: "1234567890",
        secondEmailTimestamp: "9876543210",
        timestampDifference: "Some time passed"
      },
      ipData: {
        status: "success",
        country: "United Kingdom",
        countryCode: "UK",
        region: "LON",
        regionName: "London",
        city: "London",
        zip: "NW1 4RY",
        lat: 51.53455744270914,
        lon: -0.154572358965142,
        isp: "BT Internet Services, Inc.",
        mobile: false,
        proxy: false
      },
      userAgentData: {
        browser: "Chrome",
        os: "Windows",
        platform: "Windows NT",
        version: "78.0.3904.70"
      }
    };
  });

  it("should render all the data correctly", () => {
    const result = secondEmailAsHtml(props);

    expect(result).toMatchSnapshot();
  });

  it("should render the Ip data if it's defined", () => {
    const result = secondEmailAsHtml(props);

    expect(result).toContain("Your <b>approximate</b> location:");
  });

  it("should not render the Ip data if it's undefined", () => {
    props.ipData = undefined;

    const result = secondEmailAsHtml(props);

    expect(result).not.toContain("Your <b>approximate</b> location:");
  });

  [
    { isMobile: true, isMobileDisplay: "Yes" },
    { isMobile: false, isMobileDisplay: "No" }
  ].forEach(testCase =>
    it(`should show isMobile as ${testCase.isMobileDisplay} when it is ${testCase.isMobile}`, () => {
      props.ipData!.mobile = testCase.isMobile;

      const result = secondEmailAsHtml(props);

      expect(result).toContain(`<li>Is Mobile: <!-- -->${testCase.isMobileDisplay}</li>`);
    })
  );

  [
    { isProxy: true, isProxyDisplay: "Yes" },
    { isProxy: false, isProxyDisplay: "No" }
  ].forEach(testCase =>
    it(`should show isProxy as ${testCase.isProxyDisplay} when it is ${testCase.isProxy}`, () => {
      props.ipData!.proxy = testCase.isProxy;

      const result = secondEmailAsHtml(props);

      expect(result).toContain(`<li>Is via Proxy: <!-- -->${testCase.isProxyDisplay}</li>`);
    })
  );

  it("should display the user agent section if it's defined", () => {
    const result = secondEmailAsHtml(props);

    expect(result).toContain("<p>Your device:</p>");
  });

  it("should not display the user agent section if it's undefined", () => {
    props.userAgentData = undefined;

    const result = secondEmailAsHtml(props);

    expect(result).not.toContain("<p>Your device:</p>");
  });

  it("should display the user agent browser element if it's defined", () => {
    const result = secondEmailAsHtml(props);

    expect(result).toContain("<li>Browser:");
  });

  it("should not display the user agent browser element if it's undefined", () => {
    props.userAgentData!.browser = undefined;

    const result = secondEmailAsHtml(props);

    expect(result).not.toContain("<li>Browser:");
  });

  it("should display the user agent version element if it's defined", () => {
    const result = secondEmailAsHtml(props);

    expect(result).toContain("<li>Version:");
  });

  it("should not display the user agent version element if it's undefined", () => {
    props.userAgentData!.version = undefined;

    const result = secondEmailAsHtml(props);

    expect(result).not.toContain("<li>Version:");
  });

  it("should display the user agent operating system element if it's defined", () => {
    const result = secondEmailAsHtml(props);

    expect(result).toContain("<li>Operating System:");
  });

  it("should not display the user agent operating system element if it's undefined", () => {
    props.userAgentData!.os = undefined;

    const result = secondEmailAsHtml(props);

    expect(result).not.toContain("<li>Operating System:");
  });

  it("should display the user agent platform element if it's defined", () => {
    const result = secondEmailAsHtml(props);

    expect(result).toContain("<li>Platform:");
  });

  it("should not display the user agent platform element if it's undefined", () => {
    props.userAgentData!.platform = undefined;

    const result = secondEmailAsHtml(props);

    expect(result).not.toContain("<li>Platform:");
  });
});
