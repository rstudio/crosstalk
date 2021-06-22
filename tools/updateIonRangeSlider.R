tmpdir <- tempdir()

# https://github.com/IonDen/ion.rangeSlider
version <- "2.3.1"
# types_version <- version
types_version <- "2.3.0"

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
skin_path <- file.path(
	"www",
	"shared", 
	"ionrangeslider", 
	"scss",
	"shiny.scss"
)
shiny_skin <- system.file(skin_path, package = "shiny")

file.copy(
	shiny_skin,
	file.path(target, "scss")
)

library(sass)
unlink(file.path(target, "css"), recursive = TRUE)
withr::with_dir(
  target, {
    dir.create("css")
    sass_partial(
      sass_file("scss/shiny.scss"),
      bslib::bs_theme(version = 3),
      output = "css/ion.rangeSlider.css",
      options = sass_options()
    )
  }
)
