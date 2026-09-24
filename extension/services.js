// Supported services. One entry per service.
//
//   id       key used for i18n messages (<id>_...)
//   name     display name
//   bridge   the mautrix bridge the command is meant for
//   origins  host permissions needed to read the credentials. Requested at runtime, so every
//            origin listed here must also appear in manifest.json "optional_host_permissions"
//            (build.sh checks this).
//   match    whether the URL of the active tab belongs to this service
//   extract  reads the credentials and returns { results: [{ title, steps: [{ label, text, secrets }] }] }.
//            `text` is what gets copied; every credential inside it must be listed in `secrets`,
//            which the popup masks before showing `text` (see mask.js).
//            Throws UserError for problems the user can fix (not signed in, etc.).
//
// Only credentials that the bridge accepts through bot commands are handled. The formats follow
// the bridge's own login flow definition (bridgev2 "cookies" login step).

class UserError extends Error {
  constructor(messageKey) {
    super(messageKey);
    this.messageKey = messageKey;
  }
}

// ---- Slack (mautrix-slack) ----
// Login flow "token" takes two fields in this order:
//   auth_token    xoxc-... token, stored per workspace in localStorage.localConfig_v2
//   cookie_token  the "d" cookie on slack.com (HttpOnly, so it needs the cookies API)
// `login token <auth_token> <cookie_token>` submits both in one message. The bridge URL-decodes
// the cookie value itself, so it is passed through as stored.

// Runs in the Slack tab.
function readSlackWorkspaces() {
  try {
    const cfg = JSON.parse(localStorage.localConfig_v2);
    return Object.values(cfg.teams || {})
      .filter((t) => t && typeof t.token === "string" && t.token.startsWith("xoxc-"))
      .map((t) => ({ name: t.name || t.domain || t.id, domain: t.domain || "", token: t.token }));
  } catch (e) {
    return [];
  }
}

async function extractSlack(tab) {
  const [{ result: workspaces }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: readSlackWorkspaces,
  });
  if (!workspaces || workspaces.length === 0) throw new UserError("slack_noToken");

  const cookie = await chrome.cookies.get({ url: "https://slack.com", name: "d" });
  if (!cookie || !cookie.value) throw new UserError("slack_noCookie");

  return {
    results: workspaces.map((ws) => ({
      title: ws.domain ? `${ws.name} (${ws.domain})` : ws.name,
      steps: [{ label: "", text: `login token ${ws.token} ${cookie.value}`, secrets: [ws.token, cookie.value] }],
    })),
  };
}

const SERVICES = [
  {
    id: "slack",
    name: "Slack",
    bridge: "mautrix-slack",
    origins: ["https://*.slack.com/*"],
    match: (url) => /^https:\/\/([^/]+\.)?slack\.com\//.test(url),
    extract: extractSlack,
  },
];
