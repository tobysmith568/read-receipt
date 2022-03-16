import styled from "@emotion/styled";
import Head from "next/head";
import { FC } from "react";
import { Wrapper } from ".";
import Content from "../components/content";
import Footer from "../components/footer";

// cspell: ignore noindex

const NotFoundPage: FC = () => {
  return (
    <>
      <Head>
        <title>404 - Not Found!</title>
        <meta name="description" content="404 - Not Found!" />
        <meta name="robots" content="noindex" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Wrapper>
        <Content maxWidth="800px" showHome>
          <FixedSize>
            <h1>404</h1>
            <h4>Not Found!</h4>
          </FixedSize>
        </Content>

        <Footer />
      </Wrapper>
    </>
  );
};
export default NotFoundPage;

const FixedSize = styled.div`
  height: 400px;
  width: 400px;
`;
