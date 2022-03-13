import { render } from "@testing-library/react";
import { Provider } from "jotai";
import TermsAndConditionsPage from "src/pages/terms";

describe("Terms", () => {
  it("should render the terms and conditions", () => {
    const { container } = render(
      <Provider>
        <TermsAndConditionsPage />
      </Provider>
    );

    expect(container).toMatchSnapshot();
  });
});
