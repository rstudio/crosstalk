tmpdir <- tempdir()

# https://github.com/IonDen/ion.rangeSlider
version <- "2.3.1"

zip_src <- sprintf("https://github.com/IonDen/ion.rangeSlider/archive/%s.zip", version)
zip_target <- file.path(tmpdir, "ion.zip")
download.file(zip_src, zip_target)
unzip(zip_target, exdir = dirname(zip_target))
src <- file.path(dirname(zip_target), paste0("ion.rangeSlider-", version))
target <- rprojroot::find_package_root_file("inst", "lib", "ionrangeslider")
unlink(target, recursive = TRUE)
dir.create(target)
# Move over JS files
file.rename(
  file.path(src, "js"),
  file.path(target, "js")
)

# Grab less src files and convert to sass
# Use `npx` to temp install and execute on the entire less folder
system(paste0("npx less2sass ", file.path(src, "less")))

# Copy over only the base (i.e., core) scss that we need for the shiny skin
dir.create(file.path(target, "scss"))
file.copy(
  file.path(src, "less", c("_base.scss", "_mixins.scss")),
  file.path(target, "scss", c("_base.scss", "_mixins.scss"))
)

# less2sass conversion doesn't convert this import correctly
base_css <- file.path(target, "scss", "_base.scss")
writeLines(
  sub("@import (reference)", "@import", readLines(base_css), fixed = TRUE),
  base_css
)

# Now compile Sass -> CSS so that if the default styles are requested, we
# can serve them up without compilation (The distributed CSS includes all
# the skins in the same CSS file, but we want them split up)
unlink(file.path(target, "css"), recursive = TRUE)
dir.create(file.path(target, "css"))

# copy shiny skin css
file.copy(
	file.path(
    rprojroot::find_package_root_file(),
    "tools",
    "ion.rangeSlider.skinShiny.css"
  ),
	file.path(target, "css", "ion.rangeSlider.skinShiny.css")
)

# copy shiny.scss file 
# without it handles do not show
file.copy(
  system.file(
    file.path("www", "shared", "ionrangeslider", "scss", "shiny.scss"), 
    package = "shiny"
  ), 
  file.path(target, "scss", "shiny.scss")
)

library(sass)
withr::with_dir(
  target, {
    sass(
      sass_file("scss/shiny.scss"),
      output = "css/ion.rangeSlider.css",
      options = sass_options()
    )
  }
)

unlink(tmpdir, recursive = TRUE)
