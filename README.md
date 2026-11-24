# Playwright MCP Server (TypeScript)

A minimal Model Context Protocol (MCP) server that gives an MCP-compatible AI
client control of a headless Playwright browser. It communicates over stdio and
provides navigation, page-text, click, and screenshot tools.

## Requirements

- Node.js 22.18.0 or newer (includes built-in TypeScript type stripping for the
  test files)
- npm
- A supported Playwright browser and its operating-system dependencies

## Install from scratch

From the repository root:

```sh
npm install
npx playwright install chromium
```

On Linux, if Playwright reports missing system libraries, install them with:

```sh
npx playwright install-deps chromium
```

Build and run the test suite:

```sh
npm test
npm run build
```

Start the server after building:

```sh
npm start
```

The server uses stdio for MCP messages. Do not start it in a terminal and type
into it; launch it from an MCP client instead.

## Configure an MCP client

Add a server entry to your MCP client's configuration, replacing the path with
the absolute path to this repository:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["/absolute/path/to/playwright-ai-mcp-typescript/dist/index.js"]
    }
  }
}
```

If you prefer the MCP client to build the project on startup, configure its
command as `npm` and its arguments as `["run", "start"]`, with the repository
root as the working directory if your client supports setting one.

## Available tools

| Tool | Inputs | Description |
| --- | --- | --- |
| `browser_navigate` | `url` | Open an HTTP or HTTPS URL. |
| `browser_get_text` | optional `selector` | Read visible text from the page body or a CSS selector. |
| `browser_click` | `selector` | Click the first matching element. |
| `browser_screenshot` | none | Return a PNG screenshot. |

The browser launches on the first tool call and is reused for subsequent calls.
The server reports browser and selector errors as MCP tool errors.

## Project layout

```text
src/
  browser.ts       Playwright browser lifecycle and actions
  index.ts         MCP server and tool definitions
tests/
  browser.test.ts  Local HTTP integration tests for browser actions
```
