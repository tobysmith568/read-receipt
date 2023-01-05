import { render } from "@testing-library/react";
import { getProjectLicenses } from "generate-license-file";
import { ILicense } from "generate-license-file/dist/models/license";
import { Provider } from "jotai";
import { GetStaticPropsContext, PreviewData } from "next";
import path from "path";
import { ParsedUrlQuery } from "querystring";
import React from "react";
import LicensesPage, { getStaticProps } from "src/pages/licenses";

jest.mock("generate-license-file");
const mockedGetProjectLicenses = jest.mocked(getProjectLicenses);

describe("Licenses", () => {
  const licenses: ILicense[] = [
    { content: "license content #1", dependencies: ["dependency#1@v1.2.3", "dependency#2@v4.5.6"] },
    {
      content: "license content #2",
      dependencies: ["dependency#3@7.8.9", "dependency#4@1.4.7", "dependency#5@2.5.8"]
    },
    { content: "license content #3", dependencies: ["dependency#6@3.6.9"] }
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedGetProjectLicenses.mockResolvedValue(licenses);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("getStaticProps", () => {
    const context = {} as GetStaticPropsContext<ParsedUrlQuery, PreviewData>;

    it("should get the project licenses from the package.json", async () => {
      await getStaticProps(context);

      expect(mockedGetProjectLicenses).toHaveBeenCalledTimes(1);
      const firstCallFirstArg = mockedGetProjectLicenses.mock.calls[0][0];
      const resolvedActualPackageJsonLocation = path.resolve(firstCallFirstArg);

      const resolvedExpectedPackageJsonLocation = path.resolve(
        __dirname + "/../../../package.json"
      );
      expect(resolvedActualPackageJsonLocation).toEqual(resolvedExpectedPackageJsonLocation);
    });

    it("should return the licenses", async () => {
      const result = await getStaticProps(context);

      expect(result).toEqual({
        props: { licenses }
      });
    });
  });

  it("should render licenses", () => {
    const { container } = render(
      <Provider>
        <LicensesPage licenses={licenses} />
      </Provider>
    );

    expect(container).toMatchSnapshot();
  });
});
