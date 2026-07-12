import type { FC } from "react";
import { renderToString } from "react-dom/server";

export interface FirstEmailProps {
  domain: string;
  urlSafeEmail: string;
  timestamp: number;
}

export const firstEmailAsHtml = (props: FirstEmailProps): string => {
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

const FirstEmail: FC<FirstEmailProps> = ({ domain, timestamp, urlSafeEmail }) => {
  return (
    <>
      <p>Hey 👋</p>
      <p>
        You&apos;re receiving this because you entered your email into{" "}
        <a target="_blank" rel="noreferrer noopener" href={domain}>
          Read Receipt
        </a>
        , a tool I built.
      </p>

      <p>
        This email contains a tracking pixel, a tiny invisible image. Opening it did more than
        reveal that you&apos;d opened the email; it also gave away some information about you and
        your device.
      </p>

      <p>
        Some email providers block pixels like this one. If yours didn&apos;t, opening this email
        should have already triggered a second one, which shows you everything the pixel gathered.
      </p>

      <p>
        This tool stores nothing: no cookies, no database, no logs.{" "}
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://github.com/tobysmith568/Read-Receipt">
          Source on GitHub
        </a>
        .
      </p>

      <p>
        Questions? Reach me at <a href="mailto:contact@tobythe.dev">contact@tobythe.dev</a> or{" "}
        <a href="https://tobysmith.uk">tobysmith.uk</a>.
      </p>

      <p>Thanks!</p>

      <img src={`${domain}/api/open/${urlSafeEmail}/${timestamp}`} alt="" loading="lazy" />
    </>
  );
};
