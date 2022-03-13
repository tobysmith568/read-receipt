import { render } from "@testing-library/react";
import { Provider } from "jotai";
import PrivacyPolicyPage from "src/pages/privacy";

describe("Privacy", () => {
  it("should render the privacy policy", () => {
    const { container } = render(
      <Provider>
        <PrivacyPolicyPage />
      </Provider>
    );

    expect(container).toMatchSnapshot();
  });
});
