/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React, { FC } from "react";
import { renderToString } from "react-dom/server";
import { IpResponse } from "../utils/ip";
import { UserAgentDetails } from "../utils/user-agent";

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
        You received this email because your email address was entered into the tool{" "}
        <a href={domain}>Read Receipt</a> created by <a href="https://tobysmith.uk">Toby Smith</a>{" "}
        and you opened an email containing a tracking pixel.
      </p>

      <p>
        Below shows all of the information which my implementation of a tracking pixel is able to
        expose. Note that other people or companies may be able to find out more!
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
        Some of this information may be inaccurate, especially the location and device sections.
        This is because some providers attempt to protect their users from tools like the tracking
        pixel hidden in the first email.
      </p>

      <p>
        Reopening the first email you received on different devices or by enabling/disabling WiFi on
        mobile devices will yield different results with different levels of data accuracy. If you
        have multiple emails from different providers you will see different results from each of
        them too, eg, @outlook.com or @gmail.com.
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
    </>
  );
};
