import { expect, test } from "@playwright/test";

test.describe("Third-party licenses", () => {
  test("Can be routed to from the index", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Third-party licenses." }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Third-Party Licenses", exact: true })
    ).toBeVisible();
  });

  test("Can route back to the index", async ({ page }) => {
    await page.goto("/licenses");

    await page.getByRole("link", { name: "<- Home" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Third-Party Licenses", exact: true })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Read Receipt", exact: true })
    ).toBeVisible();
  });
});
