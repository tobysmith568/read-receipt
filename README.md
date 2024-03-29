# ReadReceipt

Email senders can use a trick called a 'tracking pixel' to know exactly when you open their emails, just like a read receipt.

These pixels are not only hard to detect, but they also give away lots of personal information!

Using this website, you can receive an email containing my implementation of a tracking pixel to see examples of the information you're giving away simply by opening emails.

Hosted at: https://read-receipt.tobythe.dev

## Dev Setup

Project needs a `.env` file with the following properties for the SMTP server as well as a mock IP address to use when run as a dev build:

```
EMAIL_HOST=localhost
EMAIL_PORT=25
EMAIL_SENDER_NAME=Read Receipt
EMAIL_SENDER_EMAIL=read.receipt@whatever.com
EMAIL_USER=user
EMAIL_PASS=pass
DEV_IP=xxx.xxx.xxx.xxx
```

To run the project use:

```
npm install
npm run dev
```

# License

read-receipt is [copyrighted](./LICENSE.md) and is not available for re-distribution or re-use.

Copyright © 2020-2024 Toby Smith.

<a href="https://license-cop.js.org">
  <img alt="Protected by: License-Cop" src="https://license-cop.js.org/shield.svg">
</a>
