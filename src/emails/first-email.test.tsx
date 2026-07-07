import { describe, expect, it } from "bun:test";
import toDiffableHtml from "diffable-html";
import { type FirstEmailProps, firstEmailAsHtml } from "./first-email";

describe("first email", () => {
  it("should render correctly", () => {
    const props: FirstEmailProps = {
      domain: "https://wherever.this.is.hosted",
      timestamp: 1234567890,
      urlSafeEmail: "this.is.a.url.safe.email.address%40mail.com"
    };

    const result = firstEmailAsHtml(props);

    expect(toDiffableHtml(result).trim()).toMatchSnapshot();
  });
});
