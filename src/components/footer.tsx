import styled from "@emotion/styled";
import Link from "next/link";

const Footer = () => {
  const year = process.env.NEXT_PUBLIC_YEAR ?? null;

  return (
    <Copyright>
      Copyright © Toby Smith {year}.
      <Link href="/terms" passHref legacyBehavior>
        <LicenceLink>Terms.</LicenceLink>
      </Link>
      <Link href="/privacy" passHref legacyBehavior>
        <LicenceLink>Privacy.</LicenceLink>
      </Link>
      <Link href="/licenses" passHref legacyBehavior>
        <LicenceLink>Third-party licenses.</LicenceLink>
      </Link>
    </Copyright>
  );
};

export default Footer;

const Copyright = styled.div`
  position: absolute;
  bottom: 0;
  padding: 10px;
  font-size: 0.8em;
  width: 100%;
  text-align: center;
  color: #0c0c0c;
`;

const LicenceLink = styled.a`
  margin-left: 0.5em;
  text-decoration: none;
  color: #0c0c0c;

  &:hover {
    text-decoration: underline;
  }
`;
