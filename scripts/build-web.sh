#!/usr/bin/env bash
# Builds the web version so it runs from ANY address — whatever the GitHub repository is called.
#
# GitHub Pages serves the game under /<repository-name>/, and renaming the repository changes that
# path. Expo needs a base path at build time, so we build with a placeholder and then rewrite it
# to "./" — every file is then found relative to the page, wherever the page lives.
set -euo pipefail
cd "$(dirname "$0")/.."

PLACEHOLDER="/__maltese_base__"
rm -rf dist
npx expo export --platform web

# The page's script tag, and asset URLs inside the bundle.
sed -i "s#${PLACEHOLDER}/#./#g" dist/index.html
find dist/_expo -name "*.js" -exec sed -i "s#${PLACEHOLDER}/#./#g" {} +

if grep -rq "${PLACEHOLDER}" dist; then
  echo "Placeholder base path left in the build:" >&2
  grep -rl "${PLACEHOLDER}" dist >&2
  exit 1
fi
echo "Built dist/ — runs from any path."
