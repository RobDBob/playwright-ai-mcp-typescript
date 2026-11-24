import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BrowserController } from "./browser.js";

const browser = new BrowserController();

const server = new Server(
  { name: "playwright-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "browser_navigate",
      description: "Open an HTTP or HTTPS URL in the browser.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string", description: "URL to open" } },
        required: ["url"],
      },
    },
    {
      name: "browser_get_text",
      description: "Read visible text from the current page or a CSS selector.",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "Optional CSS selector; defaults to the whole page body.",
          },
        },
      },
    },
    {
      name: "browser_click",
      description: "Click the first element matching a CSS selector.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector to click" },
        },
        required: ["selector"],
      },
    },
    {
      name: "browser_screenshot",
      description: "Capture a PNG screenshot of the current page.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

function getStringArgument(args: unknown, key: string): string {
  if (typeof args !== "object" || args === null || !(key in args)) {
    throw new Error(`Missing or invalid string argument: ${key}`);
  }
  const value = Reflect.get(args, key);
  if (typeof value !== "string") {
    throw new Error(`Missing or invalid string argument: ${key}`);
  }
  return value;
}

function getOptionalStringArgument(args: unknown, key: string): string | undefined {
  if (typeof args !== "object" || args === null || !(key in args)) {
    return undefined;
  }
  const value = Reflect.get(args, key);
  if (typeof value !== "string") {
    throw new Error(`Invalid string argument: ${key}`);
  }
  return value;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "browser_navigate": {
        const result = await browser.navigate(getStringArgument(args, "url"));
        return {
          content: [
            {
              type: "text",
              text: `Navigated to ${result.url}\nPage title: ${result.title}`,
            },
          ],
        };
      }
      case "browser_get_text": {
        const selector = getOptionalStringArgument(args, "selector");
        return {
          content: [{ type: "text", text: await browser.getText(selector) }],
        };
      }
      case "browser_click":
        await browser.click(getStringArgument(args, "selector"));
        return {
          content: [{ type: "text", text: "Element clicked successfully." }],
        };
      case "browser_screenshot": {
        const image = await browser.screenshot();
        return {
          content: [
            {
              type: "image",
              data: image.toString("base64"),
              mimeType: "image/png",
            },
          ],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: error instanceof Error ? error.message : String(error),
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void (async () => {
      await browser.close();
      await server.close();
    })().catch((error: unknown) => {
      console.error("Failed to shut down cleanly:", error);
      process.exitCode = 1;
    });
  });
}
