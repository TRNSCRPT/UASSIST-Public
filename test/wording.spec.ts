import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const DOCS = join(import.meta.dirname, "..");
const ROOT = join(DOCS, "..");
const PAGES = globSync("**/*.html", { cwd: DOCS, exclude: ["test/**"] }).sort();
const ROOT_TEXTS = globSync("*.md", { cwd: ROOT }).sort();

/** The never-say words of OWNER_GUIDE.md section 7, which also lists them on purpose and so is not scanned for them. */
const FORBIDDEN =
  /download|universit|lecture|college|student|school|course|cursus|official|officieel|\bUA\b|not affiliated|niet verbonden/i;
const DASHES = /[–—]/;

/** Link targets are addresses, not text: a placeholder host may hold any word. */
function pageText(path: string): string {
  return readFileSync(join(DOCS, path), "utf8").replace(/\s(href|src)="[^"]*"/g, "");
}

test("every page and root text is found", () => {
  expect(PAGES.length).toBeGreaterThan(0);
  expect(ROOT_TEXTS).toContain("STORE_LISTING.md");
});

for (const path of PAGES) {
  test(`${path} uses only allowed words and no dashes`, () => {
    const text = pageText(path);
    expect(text).not.toMatch(FORBIDDEN);
    expect(text).not.toMatch(DASHES);
  });
}

test("the store texts use only allowed words", () => {
  expect(readFileSync(join(ROOT, "STORE_LISTING.md"), "utf8")).not.toMatch(FORBIDDEN);
});

for (const path of ROOT_TEXTS) {
  test(`${path} has no em or en dashes`, () => {
    expect(readFileSync(join(ROOT, path), "utf8")).not.toMatch(DASHES);
  });
}
