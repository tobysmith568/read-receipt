import { randomUUID } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";
import { getLastEmail } from "../mail-client";

// Matches any attributes between the closing quote of `src` and the closing
// `/>`, since the pixel <img> also carries `alt=""` (biome's a11y rule).
const trackingPixelRegex =
  /<img src="https?:\/\/localhost:3000\/api\/open\/(?<encodedEmail>[^/"]+)\/(?<timestamp>[0-9]+)"[^>]*\/>/;

// chromium and firefox share the same mail-server admin process (see
// e2e/mail-server.ts), so a unique recipient per test - rather than one
// fixed address - is what keeps the two projects' concurrent runs from
// reading/clearing each other's captured emails.
const uniqueEmail = () => `user+${randomUUID()}@tobysmith.uk`;

// The form is a client:load React island - if it hasn't finished hydrating
// yet when `fill` dispatches its input event, that event is missed and the
// submit button (disabled until React sees the change) never becomes
// enabled, no matter how long `click` retries. Re-filling until the button
// reports enabled self-heals against that hydration race.
const submitEmail = async (page: Page, email: string) => {
  const emailInput = page.locator("#email");
  const submitButton = page.getByRole("button", { name: "Send Email" });

  await expect(async () => {
    await emailInput.fill(email);
    await expect(submitButton).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });

  await submitButton.click();
};

test.describe("Index", () => {
  const userEmail = "user@tobysmith.uk";

  test("Using the form sends the first email with the correct tracking pixel URL", async ({
    page
  }) => {
    const userEmail = uniqueEmail();
    const encodedUserEmail = encodeURIComponent(userEmail);
    const currentUnixTimestamp = Math.floor(Date.now() / 1000);

    await page.goto("/");

    await submitEmail(page, userEmail);

    await expect(page.getByText(`Successfully sent to ${userEmail}`)).toBeVisible();

    await expect.poll(async () => (await getLastEmail(userEmail))?.subject).toBe("Read Receipt");

    const email = await getLastEmail(userEmail);
    const match = email?.html.match(trackingPixelRegex);

    expect(match?.groups?.encodedEmail).toBe(encodedUserEmail);

    const timestamp = Number(match?.groups?.timestamp);
    expect(timestamp).toBeGreaterThanOrEqual(currentUnixTimestamp);
    expect(timestamp).toBeLessThan(currentUnixTimestamp + 5);
  });

  test("Opening the first email sends the second email", async ({ page }) => {
    const userEmail = uniqueEmail();

    await page.goto("/");

    await submitEmail(page, userEmail);

    await expect(page.getByText(`Successfully sent to ${userEmail}`)).toBeVisible();

    await expect.poll(async () => (await getLastEmail(userEmail))?.subject).toBe("Read Receipt");

    const email = await getLastEmail(userEmail);

    // Writing the first email's HTML into the live page makes its (absolute-URL)
    // tracking-pixel <img> fire a real request to /api/open/..., which is what
    // actually triggers the second email.
    await page.evaluate(html => document.write(html), email?.html ?? "");

    await expect(page.getByText("Hey 👋")).toBeVisible();

    await expect
      .poll(async () => (await getLastEmail(userEmail))?.subject, { timeout: 10000 })
      .toBe("You just opened your email!");
  });

  test("Clicking 'Send another' re-shows the email input", async ({ page }) => {
    await page.goto("/");

    await submitEmail(page, userEmail);

    await expect(page.getByText(`Successfully sent to ${userEmail}`)).toBeVisible();

    await page.getByRole("button", { name: "Send another" }).click();

    await expect(page.locator("#email")).toBeVisible();
  });

  test("Entering an invalid email address shows the error message", async ({ page }) => {
    await page.goto("/");

    await submitEmail(page, "this is not an email address");

    await expect(page.getByText("Sorry, there was an error!")).toBeVisible();
  });

  test("Clicking 'Try again' re-shows the email input", async ({ page }) => {
    await page.goto("/");

    await submitEmail(page, "this is not an email address");

    await page.getByRole("button", { name: "Try again" }).click();

    await expect(page.locator("#email")).toBeVisible();
  });
});
