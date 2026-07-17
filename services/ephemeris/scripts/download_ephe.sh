#!/usr/bin/env bash
# Download Swiss Ephemeris compressed files (1800–2399 CE) into ./ephe
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${ROOT}/ephe"
BASE="https://raw.githubusercontent.com/aloistr/swisseph/master/ephe"
mkdir -p "$DEST"
for f in sepl_18.se1 semo_18.se1 seas_18.se1; do
  echo "Fetching $f…"
  curl -fsSL -o "${DEST}/${f}" "${BASE}/${f}"
done
ls -lh "$DEST"
echo "Done. Set EPHE_PATH=${DEST} (or leave unset to auto-detect ./ephe)."
