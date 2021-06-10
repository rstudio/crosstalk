shinyInstalled <- local({
  detected <- FALSE
  function() {
    if (getOption("crosstalk.shiny.suppressed", FALSE)) {
      # If crosstalk.shiny.suppressed is TRUE, we're in a special testing
      # mode and want to act as if shiny isn't installed
      return(FALSE)
    }

    if (detected) {
      return(TRUE)
    }

    # Test that Shiny is installed AND shiny::reactive hasn't been NULLed out
    if (nzchar(system.file(package = "shiny"))) {
      detected <<- TRUE
      return(TRUE)
    }

    return(FALSE)
  }
})

stopIfNotShiny <- function(message) {
  # So that we catch incorrect calls to `stopIfNotShiny` even
  # if Shiny is installed
  stopifnot(!missing(message))

  if (!shinyInstalled()) {
    stop(call. = FALSE, message)
  }
}

#' Get default reactive domain
#'
#' Pass-through to [shiny::getDefaultReactiveDomain()], unless the shiny package
#' is not installed, in which case `NULL` is returned.
#'
#' @keywords internal
#' @export
getDefaultReactiveDomain <- function() {
  if (shinyInstalled()) {
    shiny::getDefaultReactiveDomain()
  } else {
    NULL
  }
}

is.reactive <- function(x) {
  if (shinyInstalled()) {
    shiny::is.reactive(x)
  } else {
    FALSE
  }
}

reactiveValues <- function(...) {
  if (shinyInstalled()) {
    shiny::reactiveValues(...)
  } else {
    list(...)
  }
}

