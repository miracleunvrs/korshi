import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/feed",
  "/requests",
  "/notifications",
  "/documents",
  "/votes",
  "/finance",
  "/emergency",
  "/services",
  "/operations",
  "/community",
  "/classifieds",
  "/ai",
];

test.describe("critical resident routes", () => {
  for (const route of routes) {
    test(`${route} renders without horizontal overflow`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok(), `${route} returned ${response?.status()}`).toBeTruthy();
      await expect(page.locator("h1").first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    });
  }
});

test("resident can create and revoke a QR pass", async ({ page }) => {
  await page.goto("/operations");
  await page.getByRole("button", { name: "Новый пропуск" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Имя гостя").fill("E2E гость");
  await dialog.getByLabel("Действует до").fill("2030-01-02T12:00");
  await dialog.getByRole("button", { name: "Создать QR-пропуск" }).click();
  await expect(page.getByText("Пропуск создан — QR уже готов")).toBeVisible();
  const card = page.getByRole("article").filter({ hasText: "E2E гость" });
  await expect(card.getByLabel("QR-пропуск для E2E гость")).toBeVisible();
  await card.getByRole("button", { name: "Отозвать" }).click();
  await expect(card).toHaveCount(0);
});

test("mobile navigation and request bottom sheet remain usable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Mobile-only interaction");
  await page.goto("/requests");
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByRole("dialog", { name: "Что случилось?" })).toBeVisible();
  await page.getByRole("button", { name: "Закрыть форму" }).click();
});

for (const route of ["/feed", "/requests", "/operations", "/community"]) {
  test(`accessibility: ${route} has no serious or critical violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
    expect(blocking, blocking.map((item) => `${item.id}: ${item.help}`).join("\n")).toEqual([]);
  });
}
