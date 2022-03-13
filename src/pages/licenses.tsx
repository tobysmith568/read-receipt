import styled from "@emotion/styled";
import { getProjectLicenses } from "generate-license-file";
import { ILicense } from "generate-license-file/dist/models/license";
import { GetStaticProps } from "next";
import Head from "next/head";
import { FC } from "react";
import { Wrapper } from ".";
import Content from "../components/content";
import Footer from "../components/footer";

// cspell: ignore noindex

interface Props {
  licenses: ILicense[];
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const licenses = await getProjectLicenses(__dirname + "/../../../package.json");

  return {
    props: { licenses: licenses.map(l => ({ content: l.content, dependencies: l.dependencies })) }
  };
};

const LicensesPage: FC<Props> = ({ licenses }) => {
  return (
    <>
      <Head>
        <title>Licenses</title>
        <meta name="description" content="Third-party licenses" />
        <meta name="robots" content="noindex" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Wrapper>
        <Content maxWidth="800px" showHome>
          <H1>Third-Party Licenses</H1>
          <H3>This page lists all of the third-party licenses used by this website</H3>
          <H4>
            This page was generated using the{" "}
            <PackageLink
              href="https://www.npmjs.com/package/generate-license-file"
              target="_blank"
              rel="noreferrer">
              generate-license-file npm package
            </PackageLink>
            .
          </H4>
          {licenses.map((license, i) => getLicense(license, i))}
        </Content>

        <Footer />
      </Wrapper>
    </>
  );
};
export default LicensesPage;

const getLicense = (license: ILicense, i: number) => {
  return (
    <License key={i}>
      <p>The following npm packages may be included in this website:</p>
      <PackageList>
        {license.dependencies.map(dependency => (
          <li key={dependency}>
            <PackageLink href={getPackageUrl(dependency)} target="_blank" rel="noreferrer">
              {dependency}
            </PackageLink>
          </li>
        ))}
      </PackageList>
      <p>These packages contains the following license and notice below:</p>
      <LicenseContent>{license.content}</LicenseContent>
      <br />
      <hr />
      <br />
    </License>
  );
};

const getPackageUrl = (packageNameAndVersion: string) => {
  const indexOfLastAt = packageNameAndVersion.lastIndexOf("@");
  const packageName = packageNameAndVersion.substring(0, indexOfLastAt);
  const packageVersion = packageNameAndVersion.substring(indexOfLastAt + 1);

  return `https://www.npmjs.com/package/${packageName}/v/${packageVersion}`;
};

const H1 = styled.h1`
  text-align: center;
`;

const H3 = styled.h3`
  text-align: center;
  margin-bottom: 0.5em;
  font-weight: normal;
`;

const H4 = styled.h4`
  text-align: center;
  margin-bottom: 3em;
  font-weight: normal;
`;

const License = styled.div`
  padding-left: 0;
`;

const PackageList = styled.ul`
  list-style-type: none;
  margin-bottom: 1em;
`;

const PackageLink = styled.a`
  text-decoration: underline;
`;

const LicenseContent = styled.p`
  white-space: pre-line;
`;
