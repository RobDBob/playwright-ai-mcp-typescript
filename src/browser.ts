import { chromium, type Browser, type Page } from "playwright";

export class BrowserController {
  private browser: Browser | undefined;
  private page: Page | undefined;

  async navigate(address: string): Promise<{ url: string; title: string }> {
    const url = new URL(address);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Only HTTP and HTTPS URLs are supported.");
    }

    const page = await this.getPage();
    await page.goto(url.href, { waitUntil: "domcontentloaded" });
    return { url: page.url(), title: await page.title() };
  }

  async getText(selector?: string): Promise<string> {
    const page = await this.getPage();
    return selector
      ? page.locator(selector).innerText()
      : page.locator("body").innerText();
  }

  async click(selector: string): Promise<void> {
    const page = await this.getPage();
    await page.locator(selector).click();
  }

  async screenshot(): Promise<Buffer> {
    const page = await this.getPage();
    return page.screenshot({ type: "png" });
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
    this.page = undefined;
  }

  private async getPage(): Promise<Page> {
    if (!this.page) {
      this.browser = await chromium.launch({ headless: true });
      this.page = await this.browser.newPage();
    }
    return this.page;
  }
}
