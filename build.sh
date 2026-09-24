#!/usr/bin/env bash
# Package extension/ into dist/mautrix-login-helper-<version>.zip for the Chrome Web Store.
#
#   ./build.sh
#
# Before zipping, it checks what the store or the extension would otherwise reject at runtime:
#   - manifest.json has no "key" (the store refuses uploads that contain one)
#   - every origin in services.js is listed in "optional_host_permissions"
#   - the ja locale has exactly the same message keys as en
set -euo pipefail
cd "$(dirname "$0")"

NAME=mautrix-login-helper
DIST=$PWD/dist

python3 - <<'PY'
import json, re, sys
from pathlib import Path

ext = Path("extension")
m = json.loads((ext / "manifest.json").read_text())
errors = []

if "key" in m:
    errors.append('manifest.json contains "key"')

declared = set(m.get("optional_host_permissions", []))
used = set(re.findall(r'"(https://[^"]+)"', " ".join(re.findall(r"origins:\s*\[([^\]]*)\]", (ext / "services.js").read_text()))))
if used - declared:
    errors.append(f"origins missing from optional_host_permissions: {sorted(used - declared)}")
if declared - used:
    errors.append(f"optional_host_permissions not used by any service: {sorted(declared - used)}")

en = json.loads((ext / "_locales/en/messages.json").read_text())
for loc in sorted(p.name for p in (ext / "_locales").iterdir() if p.is_dir()):
    msgs = json.loads((ext / "_locales" / loc / "messages.json").read_text())
    if set(msgs) != set(en):
        errors.append(f"{loc}: keys differ from en: missing {sorted(set(en) - set(msgs))}, extra {sorted(set(msgs) - set(en))}")

if len(en["extDescription"]["message"]) > 132:
    errors.append(f'en extDescription is {len(en["extDescription"]["message"])} chars (max 132)')

if errors:
    print("\n".join("error: " + e for e in errors), file=sys.stderr)
    sys.exit(1)
PY

VER=$(python3 -c 'import json;print(json.load(open("extension/manifest.json"))["version"])')
rm -rf "$DIST"; mkdir -p "$DIST"
(cd extension && zip -qr -X "$DIST/$NAME-$VER.zip" . -x '*.DS_Store')

echo "version: $VER"
unzip -l "$DIST/$NAME-$VER.zip"
