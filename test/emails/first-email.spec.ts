import { firstEmailAsHtml, FirstEmailProps } from "../../src/emails/first-email";

describe("first email", () => {
  it("should render correctly", () => {
    const props: FirstEmailProps = {
      domain: "https://wherever.this.is.hosted",
      timestamp: 1234567890,
      urlSafeEmail: "this.is.a.url.safe.email.address%40mail.com"
    };

    const result = firstEmailAsHtml(props);

    expect(result).toMatchSnapshot();
  });
});
