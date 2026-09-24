// Stub of the extension APIs used by the popup, so that the real popup.html can run as a plain
// page (tests/test-popup.mjs and tools/screenshot.py). Loaded before the extension scripts.
// The harness prepends `const MESSAGES = <contents of messages.json>;`.
//
// On load it presses "Get login command". With #check in the URL it also presses every Copy
// button and writes what happened to <html data-result>; #check-fallback additionally makes the
// async clipboard API fail, to exercise the fallback copy path.

function getMessage(key, subs) {
  const m = MESSAGES[key];
  if (!m) return "";
  subs = subs == null ? [] : [].concat(subs);
  return m.message.replace(/\$([A-Za-z0-9_]+)\$/g, (_, name) => {
    const ph = (m.placeholders || {})[name.toLowerCase()];
    return ph ? ph.content.replace(/\$(\d)/g, (_, i) => subs[i - 1] ?? "") : "";
  });
}

const fill = (n, seed) => Array.from({ length: n }, (_, i) => "0123456789abcdef"[(i * 7 + seed) % 16]).join("");
const STUB = {
  workspaces: [
    { name: "Example Inc.", domain: "example-inc", token: "xoxc-1234567890-2345678901234-3456789012345-" + fill(64, 3) },
    { name: "Side Project", domain: "side-project", token: "xoxc-9876543210-8765432109876-7654321098765-" + fill(64, 5) },
  ],
  cookie: "xoxd-" + fill(40, 1) + "%2F" + fill(40, 9) + "%3D",
};

const copied = [];
const mode = location.hash.slice(1);

window.chrome = {
  i18n: { getMessage },
  tabs: { query: async () => [{ id: 1, url: "https://app.slack.com/client/T0000000000/C0000000000" }] },
  permissions: { request: async () => true },
  scripting: { executeScript: async () => [{ result: STUB.workspaces }] },
  cookies: { get: async () => ({ value: STUB.cookie }) },
};

Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: async (text) => {
      if (mode === "check-fallback") throw new Error("denied");
      copied.push(text);
    },
  },
});
// The fallback path copies from a hidden textarea; record what it selected.
document.addEventListener("copy", (e) => {
  const el = e.target;
  if (el && el.tagName === "TEXTAREA") copied.push(el.value.slice(el.selectionStart, el.selectionEnd));
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

addEventListener("load", async () => {
  await sleep(50);
  document.getElementById("go").click();
  if (!mode.startsWith("check")) return;
  await sleep(200);
  for (const b of document.querySelectorAll(".step button")) b.click();
  await sleep(200);
  document.documentElement.dataset.result = JSON.stringify({
    visible: document.body.innerText,
    copied,
    expected: STUB.workspaces.map((ws) => `login token ${ws.token} ${STUB.cookie}`),
    secrets: [...STUB.workspaces.map((ws) => ws.token), STUB.cookie],
  });
});
