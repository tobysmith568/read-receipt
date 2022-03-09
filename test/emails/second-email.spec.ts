import { secondEmailAsHtml, SecondEmailProps } from "src/emails/second-email";

describe("second email", () => {
  it("should render correctly", () => {
    const props: SecondEmailProps = {
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

    const result = secondEmailAsHtml(props);

    expect(result).toMatchSnapshot();
  });
});
