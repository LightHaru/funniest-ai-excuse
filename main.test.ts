import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const MAIN = fileURLToPath(new URL("./main.ts", import.meta.url));

function makeTempDir(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), "funniest-ai-excuse-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(dir: string): string {
  execFileSync(process.execPath, [MAIN, dir]);
  return readFileSync(join(dir, "entry.txt"), "utf8");
}

test("writes entry.txt at exactly <dir>/entry.txt and nothing else", (t) => {
  const dir = makeTempDir(t);
  const out = run(dir);
  assert.deepEqual(readdirSync(dir), ["entry.txt"]);
  assert.ok(statSync(join(dir, "entry.txt")).isFile());
  assert.equal(typeof out, "string");
});

test("output is deterministic across runs and directories", (t) => {
  const dirA = makeTempDir(t);
  const dirB = makeTempDir(t);
  assert.equal(run(dirA), run(dirA));
  assert.equal(run(dirA), run(dirB));
});

test("output is exactly one line: non-empty, not only whitespace, no newline", (t) => {
  const dir = makeTempDir(t);
  const out = run(dir);
  assert.ok(out.length > 0, "output must not be empty");
  assert.ok(out.trim().length > 0, "output must not be only whitespace");
  assert.ok(!out.includes("\n") && !out.includes("\r"), "output must be a single line");
});

test("output is at most 200 Unicode characters", (t) => {
  const dir = makeTempDir(t);
  const out = run(dir);
  assert.ok([...out].length <= 200, `expected <= 200 characters, got ${[...out].length}`);
});
