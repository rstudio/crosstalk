#!/usr/bin/env Rscript
library(rprojroot)

## -----------------------------------------------------------------
## First, download the main selectize.js and css
## -----------------------------------------------------------------

version <- "0.12.4"

dest_dir <- find_package_root_file("inst/lib/selectize")
tag <- paste0("v", version)
dest_file <- file.path(tempdir(), paste0("selectize.js-", version, ".zip"))
url <- sprintf("https://github.com/selectize/selectize.js/archive/%s.zip", tag)

download.file(url, dest_file)
unzipped <- tempdir()
unzip(dest_file, exdir = unzipped)

unlink(dest_dir, recursive = TRUE)

dir.create(file.path(dest_dir, "js"), recursive = TRUE)
file.copy(
  file.path(unzipped, paste0("selectize.js-", version), "dist", "js", "standalone", "selectize.min.js"),
  file.path(dest_dir, "js"),
  overwrite = TRUE
)

dir.create(file.path(dest_dir, "css"), recursive = TRUE)
file.copy(
  file.path(unzipped, paste0("selectize.js-", version), "dist", "css", "selectize.bootstrap3.css"),
  file.path(dest_dir, "css"),
  overwrite = TRUE
)
