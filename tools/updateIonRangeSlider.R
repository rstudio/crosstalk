pkg_root <- rprojroot::find_package_root_file()

# Version of shiny to use when copying over ionrangeslider assets
version <- "v1.6.0"
withr::with_tempdir({
  cmd <- paste("git clone --depth 1 --branch", version, "https://github.com/rstudio/shiny")
  system(cmd)
  setwd("shiny")
  file.copy(
    "inst/www/shared/ionrangeslider",
    file.path(pkg_root, "inst/lib"),
    recursive = TRUE
  )
})
