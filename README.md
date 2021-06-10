# Crosstalk

<!-- badges: start -->
[![CRAN](https://www.r-pkg.org/badges/version/crosstalk)](https://CRAN.R-project.org/package=crosstalk)
[![R-CMD-check](https://github.com/rstudio/crosstalk/workflows/R-CMD-check/badge.svg)](https://github.com/rstudio/crosstalk/actions)
<!-- badges: end -->

Crosstalk is a package for R that enhances the [htmlwidgets](http://www.htmlwidgets.org) package. It extends htmlwidgets with a set of classes, functions, and conventions for implementing cross-widget interactions (currently, linked brushing and filtering).

Find out more at the documentation website: http://rstudio.github.io/crosstalk/

## Building JavaScript assets

(This section is only for developers who intend to modify the JavaScript source code in Crosstalk itself.)

The JavaScript source code in this package lives under `javascript/`, however the copy that is actually loaded and used during runtime is in minified form at `inst/www/js/`. Anytime you make changes to `javascript/` source files, you must rebuild the minified JS.

To set up your repo for building the minified JS:

1. First install [nvm](https://github.com/nvm-sh/nvm) if you don't have it already.
2. In the crosstalk repo's root directory, run `nvm install`; this will install the version of Node.js we need.
3. Run `nvm use` to switch to our version of Node.js.
4. Run `npm install` to install all Node.js dependencies.

To actually build the minified JS:

1. Run `nvm use` (only needed once per terminal session).
2. Run `node node_modules/.bin/grunt` (or if you have installed `grunt-cli` globally, you can just run `grunt`).

This will run unit tests, lint, and build the JavaScript dist bundle. When making changes to the JavaScript code, you must always do this first, and then build the R package as normal.
