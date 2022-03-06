import styled from "@emotion/styled";
import { FC } from "react";

const Sending: FC = () => {
  return (
    <div>
      <SpinnerWrapper>
        <Spinner />
      </SpinnerWrapper>
      Sending
    </div>
  );
};
export default Sending;

const SpinnerWrapper = styled.div`
  margin-bottom: 1em;
`;

const Spinner = styled.div`
  border: 0.4em solid #cecece;
  border-top: 0.4em solid dodgerblue;
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
