import { expect, test } from "@playwright/test";

test.describe("Terms", () => {
  test("Can be routed to from the index", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Terms." }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Terms and Conditions", exact: true })
    ).toBeVisible();
  });

  test("Can route back to the index", async ({ page }) => {
    await page.goto("/terms");

    await page.getByRole("link", { name: "<- Home" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Terms and Conditions", exact: true })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Read Receipt", exact: true })
    ).toBeVisible();
  });
});
