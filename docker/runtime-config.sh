#!/bin/sh
set -eu

# Writes /config.js from the container environment on every start, so the API URL, organization
# and API key change without rebuilding the image.
TARGET="${MWAP_CONFIG_PATH:-/usr/share/nginx/html/config.js}"

js_string() {
  printf '%s' "$1" | tr -d '\r\n' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/</\\u003c/g'
}

cat > "$TARGET" <<EOF
window.__MWAP_CONFIG__ = {
  apiBaseUrl: "$(js_string "${VITE_MWAP_WEB_API_URL:-}")",
  sitesBaseUrl: "$(js_string "${VITE_MWAP_WEB_SITES_URL:-}")",
  siteDomain: "$(js_string "${VITE_MWAP_WEB_SITE_DOMAIN:-}")",
  orgId: "$(js_string "${ORGANIZATION_ID:-}")",
  apiKey: "$(js_string "${VITE_MWAP_WEB_API_KEY:-}")",
}
EOF

echo "runtime-config: wrote $TARGET"
