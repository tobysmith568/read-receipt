/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { FC } from "react";
import { renderToString } from "react-dom/server";

interface Props {
  domain: string;
  urlSafeEmail: string;
  timestamp: number;
}

export const firstEmailAsHtml = (props: Props): string => {
  return `<!DOCTYPE html>
<html>

<head>
  <title>Read Receipt</title>
</head>

<body>
${renderToString(<FirstEmail {...props} />)}
</body>

</html>`;
};

const FirstEmail: FC<Props> = ({ domain, timestamp, urlSafeEmail }) => {
  return (
    <>
      <p>Hey 👋</p>
      <p>
        You received this email because your email address was entered into the tool{" "}
        <a target="_blank" rel="noreferrer noopener" href={domain}>
          Read Receipt
        </a>{" "}
        created by{" "}
        <a target="_blank" rel="noreferrer noopener" href="https://tobysmith.uk">
          Toby Smith
        </a>
        .
      </p>

      <p>
        This email contains a &apos;tracking pixel&apos;; a tiny invisible image. When you opened
        this email, the image loaded and gave away not only that you opened this email, but also
        some personal information about you and your device.
      </p>

      <p>
        Some email providers are able to block these pixels, but assuming that it was successful,
        opening this email will trigger another email to be sent to you. This second email, which
        you should have already received by now, contains all of the information I was able to
        gather from you opening this email.
      </p>

      <p>
        This tool stores <b>none</b> of your personal information. It&apos;s totally stateless with
        no cookies, databases, logs, or anything else! You can check the source code{" "}
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://github.com/tobysmith568/Read-Receipt">
          on GitHub
        </a>
        .
      </p>

      <p>
        If you have any questions, you can reach out to me at{" "}
        <a href="mailto:tobysmith568@hotmail.co.uk">tobysmith568@hotmail.co.uk</a> or find me at{" "}
        <a href="https://tobysmith.uk">https://tobysmith.uk</a>.
      </p>

      <p>Thanks!</p>

      <img src={`${domain}/api/open/${urlSafeEmail}/${timestamp}`} />
    </>
  );
};
