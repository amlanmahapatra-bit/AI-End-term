import { readFileSync } from "node:fs";
import { join } from "node:path";

// Only qualified.md and services.md are ever loaded. pricing.md is deliberately absent:
// the agent must never see a price, so it cannot leak one.
const read = (name: string) => readFileSync(join(process.cwd(), "knowledge", name), "utf8");

export const qualifiedMd = () => read("qualified.md");
export const servicesMd = () => read("services.md");
