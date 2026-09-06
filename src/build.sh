#!/bin/sh

set -e
cd "$(dirname "$0")/.."

OUT=try.html
awk '/\/\*JS\*\//{exit} {print}' src/shell.html > $OUT

LOGRU=""
[ -f src/log-ru.js ] && LOGRU="src/log-ru.js"
cat src/log-en.js $LOGRU src/i18n.js src/geom.js src/glass.js src/draw.js src/ui.js src/main.js >> $OUT
awk 'f{print} /\/\*JS\*\//{f=1}' src/shell.html >> $OUT

mkdir -p app/assets
cp $OUT app/assets/index.html

V=velho.html
awk '/\/\*JS\*\//{exit} {print}' src/velho-shell.html > $V

cat src/i18n.js src/velho.js src/velho-run.js >> $V
awk 'f{print} /\/\*JS\*\//{f=1}' src/velho-shell.html >> $V
cp $V app/assets/velho.html

echo "built: $OUT ($(wc -l < $OUT) lines), $V ($(wc -l < $V) lines)"
