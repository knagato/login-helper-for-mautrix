// Credentials are never shown in full. The popup shows only the first and last 4 characters of
// each value, and the full command goes only to the clipboard. This keeps tokens out of
// screenshots, screen sharing and over-the-shoulder views.

function mask(value) {
  if (value.length <= 12) return "***";
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

// Replaces every secret in text with its masked form. Longer secrets first, so that a secret
// that happens to contain another one is masked as a whole.
function maskSecrets(text, secrets) {
  let out = text;
  for (const s of [...secrets].filter(Boolean).sort((a, b) => b.length - a.length)) {
    out = out.split(s).join(mask(s));
  }
  return out;
}
