import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(new URL("../content/site-config.json", import.meta.url), "utf8"));

export const KOFI_URL = config.kofiUrl;
