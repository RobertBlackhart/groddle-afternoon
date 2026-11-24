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
REV=$(node -e "const b=JSON.parse(require('fs').readFileSync('node_modules/playwright-core/browsers.json','utf8')).browsers.find(x=>x.name==='webkit');console.log(b.revision)")
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
# The build uses this machine's GStreamer. Without gst-plugins-good it has no autoaudiosink, and any
# <audio> or <video> load aborts the web process (RELEASE_ASSERT in MediaPlayerPrivateGStreamer::
# createAudioSink, WebKit bug 226081). Take autoaudiosink and the MP3 path (mpg123, audioparsers,
# id3demux) from the Arch package matching the system GStreamer into $DEST/gst-plugins;
# playwright-env.mjs adds it to GST_PLUGIN_PATH. With no audio sink plugin beside it, autoaudiosink falls back to a silent fake sink.
if command -v pacman >/dev/null && ! gst-inspect-1.0 autoaudiosink >/dev/null 2>&1; then
  GV=$(pacman -Q gstreamer | awk '{print $2}')
  PKG="gst-plugins-good-$GV-x86_64.pkg.tar.zst"
  if [[ -f "/var/cache/pacman/pkg/$PKG" ]]; then cp "/var/cache/pacman/pkg/$PKG" "$TMP/good.pkg"
  else curl -fsSL -o "$TMP/good.pkg" "https://archive.archlinux.org/packages/g/gst-plugins-good/$PKG"; fi
  mkdir -p "$TMP/good" "$DEST/gst-plugins"
  tar -I zstd -xf "$TMP/good.pkg" -C "$TMP/good" usr/lib/gstreamer-1.0/lib{gstautodetect,gstmpg123,gstaudioparsers,gstid3demux}.so
  cp "$TMP/good/usr/lib/gstreamer-1.0/"*.so "$DEST/gst-plugins/"
  echo "GStreamer $GV: autoaudiosink and MP3 decoding in $DEST/gst-plugins"
fi
echo "WebKit $REV ready in $DEST"
