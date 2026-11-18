import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "flybirds-demo";

async function signIn(page: Page, email: string, next: string) {
  await page.goto(`/sign-in?callbackUrl=${encodeURIComponent(next)}`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

/** Put the first in-stock size of a product in the cart and open checkout. */
async function addToCartAndCheckout(page: Page, productPath: string) {
  await page.goto(productPath);
  await page.getByRole("radiogroup", { name: "Size" }).locator("button:not([disabled])").first().click();
  await page.getByRole("button", { name: /^Add to cart/ }).first().click();
  await page.getByRole("button", { name: /^Checkout/ }).click();
  await page.waitForURL(/\/checkout\/sandbox\?order=/);
  return new URL(page.url()).searchParams.get("order")!;
}

async function paySandbox(page: Page, email: string) {
  await page.getByLabel("Email for the receipt").fill(email);
  await page.getByLabel("Full name").fill("Test Buyer");
  await page.getByLabel("Address", { exact: true }).fill("1 Market Street");
  await page.getByLabel("City", { exact: true }).fill("San Francisco");
  await page.getByLabel("Postal code").fill("94105");
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/checkout\/success\?order=/);
}

test("a guest buys a product through the sandbox checkout and the cart empties", async ({ page }) => {
  await addToCartAndCheckout(page, "/products/mens-tempo-runner-2");
  await expect(page.getByRole("note")).toContainText("no card is charged");

  // details are required before paying
  await page.getByLabel("Email for the receipt").fill("not-an-email");
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page).toHaveURL(/\/checkout\/sandbox/);

  await paySandbox(page, "guest.buyer@example.com");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("on its way");
  await expect(page.getByRole("status").first()).toContainText("Paid");
  await expect(page.getByRole("status").first()).toContainText("g•••@example.com");
  await expect(page.getByText("Shipping to")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("flybirds-cart") ?? "{}").state?.lines?.length ?? 0)).toBe(0);
});

test("cancelling at checkout keeps the cart and charges nothing", async ({ page }) => {
  await addToCartAndCheckout(page, "/products/mens-tempo-runner-2");
  await page.getByRole("button", { name: "Cancel and go back" }).click();
  await page.waitForURL(/\/checkout\/cancelled/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("cancelled");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("flybirds-cart") ?? "{}").state?.lines?.length ?? 0)).toBe(1);
});

test("the webhook rejects unsigned and forged requests", async ({ request }) => {
  const unsigned = await request.post("/api/webhooks/stripe", { data: { type: "checkout.session.completed" } });
  expect(unsigned.status()).toBe(400);
  const forged = await request.post("/api/webhooks/stripe", { data: { type: "checkout.session.completed" }, headers: { "stripe-signature": "t=1700000000,v1=deadbeef" } });
  expect(forged.status()).toBe(400);
});

test("search suggests products as you type, tolerates a typo and opens with the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search products" }).click();
  const input = page.getByRole("combobox");
  await input.fill("runer");
  await expect(page.getByRole("option").first()).toContainText("Tempo Runner 2");
  await input.press("ArrowDown");
  await expect(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
  await input.press("Enter");
  await page.waitForURL(/\/products\/.*tempo-runner-2/);

  await page.goto("/search?q=merino");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("merino");
  await expect(page.getByRole("link", { name: /Merino Base Tee/ }).first()).toBeVisible();
});

test("a signed-in customer buys, sees the order in their account, and their review is a verified purchase", async ({ page }) => {
  await signIn(page, "linus@example.com", "/");
  await addToCartAndCheckout(page, "/products/trailhead-hoodie");
  await paySandbox(page, "linus@example.com");
  await page.getByRole("link", { name: "Your orders" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your orders");
  await expect(page.getByText("Trailhead Hoodie").first()).toBeVisible();

  await page.goto("/products/trailhead-hoodie");
  await page.getByText("5 stars").locator("..").click();
  await page.getByLabel("Your review").fill("Carried it for a week of travel and it still looks new.");
  await page.getByRole("button", { name: "Post review" }).click();
  await expect(page.getByRole("status").filter({ hasText: "verified buyer badge" })).toBeVisible();
});

test("a signed-out visitor is asked to sign in before reviewing", async ({ page }) => {
  await page.goto("/products/mens-tempo-runner-2");
  await page.getByText("4 stars").locator("..").click();
  await page.getByLabel("Your review").fill("Looks great, have not bought it yet.");
  await page.getByRole("button", { name: "Post review" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Sign in to leave a review." })).toBeVisible();
});

test("ops: only admins get in; an admin ships an order and edits stock", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/sign-in/);

  await signIn(page, "linus@example.com", "/admin");
  await expect(page).not.toHaveURL(/\/admin$/);

  await page.context().clearCookies();
  await signIn(page, "admin@flybirds.dev", "/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await expect(page.locator(".recharts-surface")).toBeVisible();

  await page.goto("/admin/orders?status=PAID");
  const row = page.locator("tbody tr").first();
  const number = (await row.locator("th a").innerText()).trim();
  await row.getByRole("button", { name: `Mark ${number} as shipped` }).click();
  await expect(page.locator("tbody")).not.toContainText(number);
  await page.goto("/admin/orders?status=SHIPPED");
  await expect(page.locator("tbody")).toContainText(number);

  await page.goto("/admin/products");
  await page.locator("details summary").first().click();
  const stock = page.locator('details[open] input[name="stock"]').first();
  await stock.fill("12");
  await page.locator("details[open] form:has(input[name=stock]) button").first().click();
  await expect(page.locator("details[open] [role=status]").first()).toHaveText("Stock saved.");
});
