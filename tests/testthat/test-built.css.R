test_that("crosstalk.min.css has been built", {

  src <- system.file("www/scss/crosstalk.scss", package = "crosstalk")

  new_css <- sass::sass(
    sass::sass_file(src),
    cache = NULL,
    options = sass::sass_options(output_style = "compressed")
  )

  # Remove class and attributes
  new_css <- sub("\n", "", as.character(new_css), fixed = TRUE)

  pkg_css_file <- system.file("www/css/crosstalk.min.css", package = "crosstalk")
  pkg_css <- readLines(pkg_css_file)

  # If this fails, that means that tools/updateCrosstalkCss.R needs to be run.
  expect_identical(new_css, pkg_css)
})
