import { render } from "@testing-library/react";
import { Provider } from "jotai";
import React from "react";
import NotFoundPage from "src/pages/404";

describe("Privacy", () => {
  it("should render the privacy policy", () => {
    const { container } = render(
      <Provider>
        <NotFoundPage />
      </Provider>
    );

    expect(container).toMatchSnapshot();
  });
});
