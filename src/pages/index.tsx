import styled from "@emotion/styled";
import type { NextPage } from "next";
import Head from "next/head";
import Footer from "../components/footer";
import EmailForm from "../components/form";

const Index: NextPage = () => {
  return (
    <>
      <Head>
        <title>Read Receipt</title>
        <meta
          name="description"
          content="Email senders can use a trick called a tracking pixel to know exactly when you open their emails, just like a read receipt. Use this tool to see the information you're giving away simply by opening emails."
        />
      </Head>

      <Wrapper>
        <Content>
          <h1>Read Receipt</h1>
          <p>
            Email senders can use a trick called a &apos;tracking pixel&apos; to know exactly when
            you open their emails, just like a read receipt.
          </p>
          <p>
            These pixels are not only hard to detect, but they also give away lots of personal
            information!
          </p>
          <p>
            Using this website, you can receive an email containing my implementation of a tracking
            pixel to see examples of the information you&apos;re giving away simply by opening
            emails.
          </p>

          <EmailForm />

          <p>
            This website stores <b>none</b> of your personal information. It&apos;s totally
            stateless with no cookies, databases, logs, or anything else! You can check the source
            code on{" "}
            <a
              target="_blank"
              rel="noreferrer noopener"
              href="https://github.com/tobysmith568/Read-Receipt">
              my GitHub
            </a>
            .
          </p>
        </Content>

        <Footer />
      </Wrapper>
    </>
  );
};

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: grid;
  place-content: center;
`;

const Content = styled.div`
  max-width: 500px;
  background: #f9f9f9;
  padding: 25px;
  text-align: center;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);
`;

export default Index;
