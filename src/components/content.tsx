import styled from "@emotion/styled";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

interface Props {
  showHome?: boolean;
  maxWidth: string;
}

const Content: FC<PropsWithChildren<Props>> = ({ showHome, maxWidth, children }) => {
  return (
    <>
      {showHome && (
        <Link href="/" passHref legacyBehavior>
          <HomeButton>&lt;- Home</HomeButton>
        </Link>
      )}
      <InnerContent maxWidth={maxWidth}>{children}</InnerContent>
    </>
  );
};
export default Content;

interface InnerContentProps {
  maxWidth: string;
}

const HomeButton = styled.a`
  padding-bottom: 0.25em;
  margin-left: 0.25em;
  color: #0c0c0c;
`;

const InnerContent = styled.div<InnerContentProps>`
  max-width: ${props => props.maxWidth};
  max-height: 80vh;
  background: #f9f9f9;
  padding: 25px;
  text-align: center;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);
  overflow-y: auto;
  white-space: pre-line;
`;
