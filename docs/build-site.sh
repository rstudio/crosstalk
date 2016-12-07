#!/bin/bash

set -e

RSTUDIO_PANDOC=/Applications/RStudio.app/Contents/MacOS/pandoc R --slave -e 'rmarkdown::clean_site("."); rmarkdown::render_site(".")'
