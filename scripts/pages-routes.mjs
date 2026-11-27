import { copyFile, mkdir, readFile } from "node:fs/promises";
import { editions } from "../src/editions.js";

const output = new URL("../dist/", import.meta.url);
const entry = new URL("index.html", output);
const products = JSON.parse(await readFile(new URL("products.json", output), "utf8"));
const routes = ["", "catalog", "cart", "order", ...products.map(({ id }) => `catalog/${id}`)];

// Pages can serve direct SPA URLs from static directories without a rewrite rule.
for (const edition of ["", ...Object.keys(editions)]) {
  for (const route of routes) {
    const path = [edition, route].filter(Boolean).join("/");
    if (!path) continue;
    const directory = new URL(`${path}/`, output);
    await mkdir(directory, { recursive: true });
    await copyFile(entry, new URL("index.html", directory));
  }
}
await copyFile(entry, new URL("404.html", output));
