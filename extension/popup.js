const $ = (id) => document.getElementById(id);
const t = (key, subs) => chrome.i18n.getMessage(key, subs) || key;

for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);

function setStatus(cls, text) {
  const span = document.createElement("span");
  span.className = cls;
  span.textContent = text;
  $("status").replaceChildren(span);
}

// Copies without ever putting the value on screen. If the async clipboard API is refused, falls
// back to an invisible textarea instead of revealing the value for manual copying.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function renderCopyBlock(parent, title, step) {
  const div = document.createElement("div");
  div.className = "step";
  const b = document.createElement("b");
  b.textContent = title;
  const cmd = document.createElement("div");
  cmd.className = "cmd";
  cmd.textContent = maskSecrets(step.text, step.secrets);
  const button = document.createElement("button");
  button.textContent = t("copy");
  const result = document.createElement("span");
  result.className = "note";
  button.addEventListener("click", async () => {
    const ok = await copyText(step.text);
    button.textContent = ok ? t("copied") : t("copy");
    result.className = ok ? "note" : "warn";
    result.textContent = ok ? "" : ` ${t("copyFailed")}`;
  });
  div.append(b, cmd, button, result);
  parent.appendChild(div);
}

// Resolved when the popup opens so that the click handler can request permissions first thing,
// while the click still counts as a user gesture.
let tab = null;
let service = null;

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  service = SERVICES.find((s) => tab && tab.url && s.match(tab.url)) || null;
  if (service) {
    $("svc").textContent = t("detected", [service.name, service.bridge]);
    setStatus("", t("readyHint"));
  } else {
    setStatus("warn", t("unsupportedTab", [SERVICES.map((s) => s.name).join(" / ")]));
    $("go").disabled = true;
  }
}

$("go").addEventListener("click", async () => {
  if (!service) return;
  const out = $("out");
  out.replaceChildren();
  try {
    // Resolves to true without prompting if already granted.
    const granted = await chrome.permissions.request({ origins: service.origins });
    if (!granted) {
      setStatus("warn", t("permissionDenied", [service.name]));
      return;
    }
    const { results } = await service.extract(tab);
    setStatus("ok", t(`${service.id}_ok`));
    for (const r of results) {
      for (const step of r.steps) renderCopyBlock(out, [r.title, step.label].filter(Boolean).join(" — "), step);
    }
    for (const key of ["maskedNote", "prefixNote"]) {
      const note = document.createElement("div");
      note.className = "note";
      note.textContent = t(key);
      out.appendChild(note);
    }
  } catch (e) {
    if (e instanceof UserError) setStatus("warn", t(e.messageKey));
    else setStatus("warn", t("errorGeneric", [String(e)]));
  }
});

init();
