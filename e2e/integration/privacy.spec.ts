import { expect, test } from "@playwright/test";

test.describe("Privacy", () => {
  test("Can be routed to from the index", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Privacy." }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy", exact: true })
    ).toBeVisible();
  });

  test("Can route back to the index", async ({ page }) => {
    await page.goto("/privacy");

    await page.getByRole("link", { name: "<- Home" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy", exact: true })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Read Receipt", exact: true })
    ).toBeVisible();
  });
});
