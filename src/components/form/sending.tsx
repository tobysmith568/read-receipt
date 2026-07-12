import styled from "@emotion/styled";
import type { FC } from "react";

const Sending: FC = () => {
  return (
    <Wrapper>
      <SpinnerWrapper>
        <Spinner />
      </SpinnerWrapper>
      Sending
    </Wrapper>
  );
};
export default Sending;

const Wrapper = styled.div`
  text-align: center;
`;

const SpinnerWrapper = styled.div`
  margin-bottom: 1em;
`;

const Spinner = styled.div`
  border: 0.4em solid var(--color-card-border);
  border-top: 0.4em solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  height: 3em;
  width: 3em;
  margin: auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
