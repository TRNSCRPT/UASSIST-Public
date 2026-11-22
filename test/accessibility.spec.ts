import { globSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const DOCS = join(import.meta.dirname, "..");
const PAGES = globSync("**/*.html", { cwd: DOCS, exclude: ["test/**"] }).sort();
const WIDTHS = [320, 768, 1440];

test("every page is found", () => {
  expect(PAGES.length).toBeGreaterThan(0);
});

/** WCAG 2.2 AA with axe, and no sideways scrolling (reflow, 1.4.10), at every width. */
for (const path of PAGES) {
  test(path, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(pathToFileURL(join(DOCS, path)).href);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => `${node.html} ${node.failureSummary}`).join(" | ")}`,
        ),
        `${path} at ${width}px`,
      ).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} scrolls sideways at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}
