import type { FC } from "react";
import { renderToString } from "react-dom/server";
import type { IpResponse } from "../utils/ip";
import type { UserAgentDetails } from "../utils/user-agent";

export interface User {
  email: string;
  ip: string;
}

export interface Times {
  firstEmailTimestamp: string;
  secondEmailTimestamp: string;
  timestampDifference: string;
}

export interface SecondEmailProps {
  domain: string;
  user: User;
  times: Times;
  ipData?: IpResponse;
  userAgentData?: UserAgentDetails;
}

export const secondEmailAsHtml = (props: SecondEmailProps): string => {
  return `<!DOCTYPE html>
<html>

<head>
  <title>Read Receipt</title>
</head>

<body>
${renderToString(<SecondEmail {...props} />)}
</body>

</html>`;
};

const SecondEmail: FC<SecondEmailProps> = ({ domain, user, times, ipData, userAgentData }) => {
  return (
    <>
      <p>Hey 👋</p>
      <p>
        You&apos;re receiving this because you opened an email from{" "}
        <a href={domain}>Read Receipt</a> containing a tracking pixel.
      </p>

      <p>
        Here&apos;s everything it was able to expose. Other senders may be able to gather even more.
      </p>

      <p>Times:</p>

      <ul>
        <li>First email sent at: {times.firstEmailTimestamp}</li>
        <li>This email sent at: {times.secondEmailTimestamp}</li>
        <li>Time difference: {times.timestampDifference}</li>
      </ul>

      <p>You:</p>
      <ul>
        <li>Email: {user.email}</li>
        <li>IP Address: {user.ip}</li>
      </ul>

      {!!ipData && (
        <>
          <p>
            Your <b>approximate</b> location:
          </p>
          <ul>
            <li>{ipData.city}</li>
            <li>{ipData.zip}</li>
            <li>
              {ipData.regionName} ({ipData.region})
            </li>
            <li>
              {ipData.country} ({ipData.countryCode})
            </li>
            <p>
              <li>
                Lat: {ipData.lat}, Lon: {ipData.lon}
              </li>
            </p>
          </ul>

          <p>Your connection:</p>
          <ul>
            <li>Is Mobile: {ipData.mobile ? "Yes" : "No"}</li>
            <li>Is via Proxy: {ipData.proxy ? "Yes" : "No"}</li>
            <li>Internet provider: {ipData.isp}</li>
          </ul>
        </>
      )}

      {!!userAgentData && (
        <>
          <p>Your device:</p>
          <ul>
            {!!userAgentData.browser && <li>Browser: {userAgentData.browser}</li>}
            {!!userAgentData.version && <li>Version: {userAgentData.version}</li>}
            {!!userAgentData.os && <li>Operating System: {userAgentData.os}</li>}
            {!!userAgentData.platform && <li>Platform: {userAgentData.platform}</li>}
          </ul>
        </>
      )}

      <p>
        Some of this may be inaccurate, especially location and device, since some providers try to
        protect users from tracking pixels like this one.
      </p>

      <p>
        Reopening the first email on a different device, or with WiFi toggled on mobile, will give
        different results. Different providers (e.g. Outlook vs Gmail) will also show different
        levels of accuracy.
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
    </>
  );
};
