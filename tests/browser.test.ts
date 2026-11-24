import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import { BrowserController } from "../src/browser.ts";

const controller = new BrowserController();
let httpServer: Server;
let baseUrl: string;

before(async () => {
  httpServer = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html>
      <html><head><title>Playwright test page</title></head>
      <body><p id="message">Ready</p>
      <button id="change" onclick="document.querySelector('#message').textContent = 'Clicked'">Change</button>
      </body></html>`);
  });
  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  assert(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await controller.close();
  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => (error ? reject(error) : resolve()));
  });
});

test("navigates to a page and reads its title and visible text", async () => {
  const result = await controller.navigate(baseUrl);
  assert.equal(result.title, "Playwright test page");
  assert.equal(await controller.getText("#message"), "Ready");
});

test("clicks an element and captures a PNG screenshot", async () => {
  await controller.click("#change");
  assert.equal(await controller.getText("#message"), "Clicked");
  const screenshot = await controller.screenshot();
  assert.equal(screenshot.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
});

test("rejects unsupported URL protocols", async () => {
  await assert.rejects(
    controller.navigate("file:///etc/passwd"),
    /Only HTTP and HTTPS URLs are supported/,
  );
});
