import { readFile, writeFile } from "node:fs/promises";
import { transform } from "esbuild";
const source = await readFile(
  new URL("../src/lib/widget-runtime.ts", import.meta.url),
  "utf8",
);
const { code } = await transform(source, { loader: "ts", format: "esm" });
const { WIDGET_RUNTIME } = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
await writeFile(
  new URL("../public/widget-runtime.js", import.meta.url),
  WIDGET_RUNTIME,
);
