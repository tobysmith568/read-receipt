import styled from "@emotion/styled";

const year = new Date().getFullYear().toString();

const Footer = () => {
  return <Copyright>Copyright © Toby Smith {year}</Copyright>;
};

export default Footer;

const Copyright = styled.div`
  position: absolute;
  bottom: 0;
  padding: 10px;
  font-size: 0.8em;
  width: 100%;
  text-align: center;
  z-index: -1;
  color: #0c0c0c;
`;
