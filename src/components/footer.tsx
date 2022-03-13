import styled from "@emotion/styled";
import Link from "next/link";

const year = new Date().getFullYear().toString();

const Footer = () => {
  return (
    <Copyright>
      Copyright © Toby Smith {year}.
      <Link href="/terms" passHref>
        <LicenceLink>Terms and Conditions.</LicenceLink>
      </Link>
      <Link href="/privacy" passHref>
        <LicenceLink>Privacy policy.</LicenceLink>
      </Link>
      <Link href="/licenses" passHref>
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
