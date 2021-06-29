library(sass)
library(rprojroot)
www <- find_package_root_file("inst/www")
sass(
  sass_file(file.path(www, "scss/crosstalk.scss")),
  output = file.path(www, "css/crosstalk.min.css"),
  options = sass_options(output_style = "compressed")
)
