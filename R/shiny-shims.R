shinyInstalled <- local({
  detected <- FALSE
  function() {
    if (detected) {
      return(TRUE)
    }

    if (nzchar(system.file(package = "shiny"))) {
      detected <<- TRUE
      return(TRUE)
    }

    return(FALSE)
  }
})

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

