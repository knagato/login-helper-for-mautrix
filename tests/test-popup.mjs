// Tests for the popup.
//
//   node tests/test-popup.mjs
//
// 1. mask.js / services.js in a Node vm with a stubbed `chrome` (no browser needed).
// 2. The real popup.html in headless Chrome with tests/chrome-stub.js: no credential may appear
//    in the visible text, and Copy must put the full command on the clipboard. Skipped if
//    Chrome is not found (set CHROME=/path/to/chrome).
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createContext, runInContext } from "node:vm";

const ROOT = new URL("..", import.meta.url).pathname;
const EXT = join(ROOT, "extension");
const read = (p) => readFileSync(join(EXT, p), "utf8");

let failures = 0;
const check = (name, cond, extra = "") => {
  if (cond) console.log(`  ok   ${name}`);
  else { failures++; console.log(`  FAIL ${name}${extra ? " — " + extra : ""}`); }
};

function load({ workspaces = [], cookie = null } = {}) {
  const ctx = {
    chrome: {
      scripting: { executeScript: async () => [{ result: workspaces }] },
      cookies: { get: async ({ url, name }) => (url === "https://slack.com" && name === "d" && cookie ? { value: cookie } : null) },
    },
    console,
  };
  createContext(ctx);
  // Top-level class/const bindings are not properties of the context; expose what the tests use.
  runInContext(read("mask.js") + read("services.js") + "\nthis.SERVICES = SERVICES; this.UserError = UserError;", ctx);
  return ctx;
}

const TOKEN = "xoxc-1111111111-2222222222222-3333333333333-" + "a".repeat(64);
const COOKIE = "xoxd-" + "b".repeat(40) + "%2F" + "c".repeat(40) + "%3D";

console.log("mask");
{
  const ctx = load();
  check("keeps first and last 4", ctx.mask(TOKEN) === "xoxc***aaaa", ctx.mask(TOKEN));
  check("short values are fully hidden", ctx.mask("short") === "***");
  const text = `login token ${TOKEN} ${COOKIE}`;
  const masked = ctx.maskSecrets(text, [TOKEN, COOKIE]);
  check("masks every secret", masked === "login token xoxc***aaaa xoxd***c%3D", masked);
  check("leaks no secret", !masked.includes(TOKEN) && !masked.includes(COOKIE));
  check("longer secret masked as a whole", ctx.maskSecrets(`x ${TOKEN}`, ["xoxc-1111111111", TOKEN]) === "x xoxc***aaaa");
  check("ignores empty secrets", ctx.maskSecrets("login token", ["", null]) === "login token");
}

console.log("slack");
const slack = (ctx) => ctx.SERVICES.find((s) => s.id === "slack");
{
  const ctx = load();
  check("matches app.slack.com", slack(ctx).match("https://app.slack.com/client/T1/C1"));
  check("matches workspace subdomain", slack(ctx).match("https://example.slack.com/"));
  check("does not match look-alikes", !slack(ctx).match("https://slack.com.evil.example/") && !slack(ctx).match("https://notslack.com/"));
}
{
  const ctx = load({ workspaces: [{ name: "Example", domain: "example", token: TOKEN }], cookie: COOKIE });
  const { results } = await slack(ctx).extract({ id: 1 });
  const step = results[0].steps[0];
  check("builds login token command", step.text === `login token ${TOKEN} ${COOKIE}`, step.text);
  check("declares both values as secrets", step.secrets.includes(TOKEN) && step.secrets.includes(COOKIE));
  check("titles by workspace", results[0].title === "Example (example)");
}
{
  const ctx = load({ workspaces: [], cookie: COOKIE });
  const err = await slack(ctx).extract({ id: 1 }).catch((e) => e);
  check("no token → slack_noToken", err instanceof ctx.UserError && err.messageKey === "slack_noToken");
}
{
  const ctx = load({ workspaces: [{ name: "Example", domain: "example", token: TOKEN }] });
  const err = await slack(ctx).extract({ id: 1 }).catch((e) => e);
  check("no cookie → slack_noCookie", err instanceof ctx.UserError && err.messageKey === "slack_noCookie");
}

console.log("popup in Chrome");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) {
  console.log("  skip (Chrome not found)");
} else {
  const dir = mkdtempSync(join(tmpdir(), "mlh-test-"));
  try {
    cpSync(EXT, dir, { recursive: true });
    const html = read("popup.html").replace('<script src="mask.js">', '<script src="stub.js"></script>\n<script src="mask.js">');
    writeFileSync(join(dir, "popup-stub.html"), html);
    writeFileSync(join(dir, "stub.js"), `const MESSAGES = ${read("_locales/en/messages.json")};\n` + readFileSync(join(ROOT, "tests/chrome-stub.js"), "utf8"));

    for (const mode of ["check", "check-fallback"]) {
      const url = pathToFileURL(join(dir, "popup-stub.html")).href + "#" + mode;
      const dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", url], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const m = dom.match(/data-result="([^"]*)"/);
      if (!m) { check(`${mode}: popup ran`, false, "no data-result in DOM"); continue; }
      const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
      check(`${mode}: shows a masked command per workspace`, (r.visible.match(/login token xoxc\*\*\*/g) || []).length === r.expected.length);
      check(`${mode}: no credential in visible text`, r.secrets.every((s) => !r.visible.includes(s)));
      if (mode === "check") {
        check(`${mode}: copies the full commands`, JSON.stringify(r.copied) === JSON.stringify(r.expected), JSON.stringify(r.copied));
      } else {
        // Headless Chrome may refuse execCommand("copy") without a real user gesture. Either way the
        // value must stay off screen: copied through the hidden textarea, or a failure message.
        const copiedAll = JSON.stringify(r.copied) === JSON.stringify(r.expected);
        const reported = r.visible.includes("Couldn't copy");
        check(`${mode}: copies via fallback or reports failure`, copiedAll || reported, JSON.stringify(r.copied));
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log(failures ? `\n${failures} failing` : "\nall passing");
process.exit(failures ? 1 : 0);
