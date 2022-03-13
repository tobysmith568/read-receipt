import { render } from "@testing-library/react";
import { ILicense } from "generate-license-file/dist/models/license";
import { Provider } from "jotai";
import LicensesPage from "src/pages/licenses";

describe("Licenses", () => {
  it("should render licenses", () => {
    const licenses: ILicense[] = [
      { content: "license content #1", dependencies: ["dependency #1", "dependency #2"] },
      {
        content: "license content #2",
        dependencies: ["dependency #3", "dependency #4", "dependency #5"]
      },
      { content: "license content #3", dependencies: ["dependency #6"] }
    ];

    const { container } = render(
      <Provider>
        <LicensesPage licenses={licenses} />
      </Provider>
    );

    expect(container).toMatchSnapshot();
  });
});
