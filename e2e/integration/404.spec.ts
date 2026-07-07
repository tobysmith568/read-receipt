import { expect, test } from "@playwright/test";

test.describe("404", () => {
  test("Shows for invalid urls", async ({ page }) => {
    await page.goto("/this-is-not-a-valid-url");

    await expect(page.getByRole("heading", { level: 1, name: "404", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 4, name: "Not Found!", exact: true })
    ).toBeVisible();
  });

  test("Can route back to the index", async ({ page }) => {
    await page.goto("/this-is-not-a-valid-url");

    await page.getByRole("link", { name: "<- Home" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "404", exact: true })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Read Receipt", exact: true })
    ).toBeVisible();
  });
});
