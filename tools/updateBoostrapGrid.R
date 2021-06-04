library(bslib)
bs3 <- bs_theme(version = 3)
exclude <- setdiff(
  unique(names(bs3$layers)), 
  c(
    "_grid", 
    "", 
    "_scaffolding"
  )
)
sass::sass(
  bs_remove(bs3, exclude),
  output = "inst/lib/bootstrap/bootstrap-grid.min.css",
  options = sass::sass_options(
    output_style = "compressed"
  )
)

