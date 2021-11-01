lib_dir <- rprojroot::find_package_root_file("inst/lib")
unlink(file.path(lib_dir, "ionrangeslider"), recursive = TRUE)

# Version of shiny to use when copying over ionrangeslider assets
version <- "main"
withr::with_tempdir({
  cmd <- paste("git clone --depth 1 --branch", version, "https://github.com/rstudio/shiny")
  system(cmd)
  file.copy(
    "shiny/inst/www/shared/ionrangeslider", lib_dir, recursive = TRUE
  )
})
