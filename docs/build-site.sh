#!/bin/bash

set -eu -o pipefail

(cd .. && npm run jsdoc2md)

cat filter.Rmd \
  | sed -e 's/ --- / ------------- /g' \
  | sed -e 's/exports.FilterHandle/crosstalk.FilterHandle/' \
  > filter.out.Rmd

cat selection.Rmd \
  | sed -e 's/ --- / ------------- /g' \
  | sed -e 's/exports.SelectionHandle/crosstalk.SelectionHandle/' \
  > selection.out.Rmd

mv filter.out.Rmd filter.Rmd
mv selection.out.Rmd selection.Rmd

R --vanilla --no-echo << 'EOF'
set.seed(100)
rmarkdown::clean_site(".", preview = FALSE)
rmarkdown::render_site(".")
EOF
