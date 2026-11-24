#!/usr/bin/env bash
# Installs Playwright's WebKit (Safari's engine) for QA on a Linux that Playwright does not support
# directly, such as Arch (R52: iPhone and iPad reports could not be reproduced here).
#
#   tools/qa/setup-webkit.sh        # then: openBrowser({ engine: 'webkit' }) in tools/qa/browser.mjs
#
# It downloads the Ubuntu 24.04 WebKit build for the Playwright version in node_modules, unpacks it
# where Playwright looks, and copies the four libraries that build needs from Ubuntu 24.04 packages
# (icu 74, libxml2 2.9, libvpx 9, flite) into the build's own sys/lib folder. Nothing is installed
# system-wide and no sudo is used. Re-run it after a Playwright upgrade.
set -euo pipefail
cd "$(dirname "$0")/../.."
REV=$(node -e "const b=require('playwright-core/browsers.json').browsers.find(x=>x.name==='webkit');console.log(b.revision)")
CACHE=${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}
DEST="$CACHE/webkit-$REV"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
if [[ ! -f "$DEST/INSTALLATION_COMPLETE" ]]; then
  echo "WebKit $REV: downloading the Ubuntu 24.04 build"
  curl -fsSL -o "$TMP/webkit.zip" "https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/webkit/$REV/webkit-ubuntu-24.04.zip"
  rm -rf "$DEST" && mkdir -p "$DEST"
  unzip -q "$TMP/webkit.zip" -d "$DEST"
  touch "$DEST/INSTALLATION_COMPLETE"
fi
echo "Ubuntu 24.04 libraries for it"
for pocket in noble-updates noble; do
  for comp in main universe; do
    curl -fsSL "http://archive.ubuntu.com/ubuntu/dists/$pocket/$comp/binary-amd64/Packages.gz" | gunzip >> "$TMP/Packages"
  done
done
mkdir -p "$TMP/x" "$TMP/lib"
for pkg in libicu74 libxml2 libvpx9 libflite1; do
  f=$(awk -v p="$pkg" '/^Package: /{n=$2} /^Filename: /{ if (n==p) { print $2; exit } }' "$TMP/Packages")
  [[ -n "$f" ]] || { echo "no Ubuntu 24.04 package $pkg" >&2; exit 1; }
  curl -fsSL -o "$TMP/$pkg.deb" "http://archive.ubuntu.com/ubuntu/$f"
  (cd "$TMP/x" && ar x "../$pkg.deb" && tar -xf data.tar.* && rm -f data.tar.* control.tar.* debian-binary)
done
find "$TMP/x" -name '*.so*' -exec cp -a {} "$TMP/lib/" \;
for m in minibrowser-wpe minibrowser-gtk; do cp -a "$TMP/lib/." "$DEST/$m/sys/lib/"; done
echo "WebKit $REV ready in $DEST"
