#!/bin/bash

set -e

(cd .. && node node_modules/.bin/jsdoc2md javascript/src/filter.js | sed -e 's/ --- / ------------- /g' | sed -e 's/new FilterHandle/new crosstalk.FilterHandle/' > docs/filter.Rmd)
(cd .. && node node_modules/.bin/jsdoc2md javascript/src/selection.js | sed -e 's/ --- / ------------- /g' > docs/selection.Rmd)

RSTUDIO_PANDOC=/Applications/RStudio.app/Contents/MacOS/pandoc R --slave -e 'set.seed(100); rmarkdown::clean_site("."); rmarkdown::render_site(".")'
