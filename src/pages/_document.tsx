import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        <base href="/" />
        <meta charSet="utf-8" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=zdnfztgnfgt" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=zdnfztgnfgt" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=zdnfztgnfgt" />
        <link rel="manifest" href="/site.webmanifest?v=zdnfztgnfgt" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg?v=zdnfztgnfgt" color="#2fa7ec" />
        <link rel="shortcut icon" href="/favicon.ico?v=zdnfztgnfgt" />
        <meta name="msapplication-TileColor" content="#2fa7ec" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
