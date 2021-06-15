# crosstalk >=v1.1.1.9000 removes the Bootstrap dependency from bscols(),
# filter_select(), and filter_checkbox(). In order to make bscols() still work,
# we attach just the grid layout necessary to make it work. Note that the grid
# layout is based on `box-sizing: border-box`, which is set in _scaffolding.scss
# (i.e., browser resets), but we take a more conservative approach of only
# setting box-sizing within bscols()
# https://github.com/twbs/bootstrap-sass/blob/b34765d/assets/stylesheets/bootstrap/_scaffolding.scss#L6-L17
# https://css-tricks.com/inheriting-box-sizing-probably-slightly-better-best-practice/

library(bslib)
library(magrittr)
bs3 <- bs_theme(version = 3)
exclude <- setdiff(
  unique(names(bs3$layers)),
  c("_grid", "")
)
sass::sass(
  bs_remove(bs3, exclude) %>%
    bs_add_rules(c(
      ".crosstalk-bscols {",
      "  box-sizing: border-box;",
      "  *, *:before, *:after { box-sizing: inherit; }",
      "}"
    )),
  output = "inst/lib/bootstrap/bootstrap-grid.min.css",
  options = sass::sass_options(output_style = "compressed")
)

