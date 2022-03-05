const year = new Date().getFullYear().toString();

const Footer = () => {
  return <div className="copyright">Copyright © Toby Smith {year}</div>;
};

export default Footer;
