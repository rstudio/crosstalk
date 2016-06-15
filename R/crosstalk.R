#' @import htmltools
init <- function() {
  htmltools::attachDependencies(
    list(),
    dependencies()
  )
}

#' @export
dependencies <- function() {
  list(
    jqueryLib(),
    htmltools::htmlDependency("crosstalk", packageVersion("crosstalk"),
      src = system.file("www", package = "crosstalk"),
      script = "js/crosstalk.js"
    )
  )
}

#' ClientValue object
#'
#' An object that can be used in a \href{http://shiny.rstudio.com}{Shiny} server
#' function to get or set a crosstalk variable that exists on the client. The
#' client copy of the variable is the canonical copy, so there is no direct
#' "set" method that immediately changes the value; instead, there is a
#' \code{sendUpdate} method that sends a request to the browser to change the
#' value, which will then cause the new value to be relayed back to the server.
#'
#' @section Methods:
#' \describe{
#'   \item{\code{initialize(name, group = "default", session = shiny::getDefaultReactiveDomain())}}{
#'     Create a new ClientValue object to reflect the crosstalk variable
#'     specified by \code{group} and \code{name}. The \code{session} indicates
#'     which Shiny session to connect to, and defaults to the current session.
#'   }
#'   \item{\code{get()}}{
#' Read the value. This is a reactive operation akin to reading a reactive
#' value, and so can only be done in a reactive context (e.g. in a
#' \code{\link[shiny]{reactive}}, \code{\link[shiny]{observe}}, or
#' \code{\link[shiny]{isolate}} block).
#'   }
#'   \item{\code{sendUpdate(value)}}{
#'     Send a message to the browser asking it to update the crosstalk var to
#'     the given value. This update does not happen synchronously, that is, a
#'     call to \code{get()} immediately following \code{sendUpdate(value)} will
#'     not reflect the new value. The value must be serializable as JSON using
#'     jsonlite.
#'   }
#' }
#'
#' @examples
#' library(shiny)
#'
#' server <- function(input, output, session) {
#'   cv <- ClientValue$new("var1", "group1")
#'
#'   r <- reactive({
#'     # Don't proceed unless cv$get() is a non-NULL value
#'     validate(need(cv$get(), message = FALSE))
#'
#'     runif(cv$get())
#'   })
#'
#'   observeEvent(input$click, {
#'     cv$sendUpdate(NULL)
#'   })
#' }
#'
#' @docType class
#' @import R6
#' @format An \code{\link{R6Class}} generator object
#' @export
ClientValue <- R6Class(
  "ClientValue",
  private = list(
    .session = "ANY",
    .name = "ANY",
    .group = "ANY",
    .qualifiedName = "ANY",
    .rv = "ANY"
  ),
  public = list(
    initialize = function(name, group = "default", session = shiny::getDefaultReactiveDomain()) {
      private$.session <- session
      private$.name <- name
      private$.group <- group
      private$.qualifiedName <- paste0(".clientValue-", group, "-", name)
    },
    get = function() {
      private$.session$input[[private$.qualifiedName]]
    },
    sendUpdate = function(value) {
      private$.session$sendCustomMessage("update-client-value", list(
        name = private$.name,
        group = private$.group,
        value = value
      ))
    }
  )
)


createUniqueId <- function (bytes, prefix = "", suffix = "") {
  paste(prefix, paste(format(as.hexmode(sample(256, bytes,
    replace = TRUE) - 1), width = 2), collapse = ""),
    suffix, sep = "")
}



#' @import R6 shiny
#' @export
SharedData <- R6Class(
  "SharedData",
  private = list(
    .data = "ANY",
    .key = "ANY",
    .filterCV = "ANY",
    .selectionCV = "ANY",
    .rv = "ANY",
    .group = "ANY"
  ),
  public = list(
    initialize = function(data, key = NULL, group = createUniqueId(4, prefix = "SharedData")) {
      private$.data <- data
      private$.key <- key
      private$.filterCV <- ClientValue$new("filter", group)
      private$.selectionCV <- ClientValue$new("selection", group)
      private$.rv <- shiny::reactiveValues()
      private$.group <- group

      if (shiny::is.reactive(private$.data)) {
        observeEvent(private$.data(), {
          self$clearSelection()
        })
      }

      domain <- shiny::getDefaultReactiveDomain()
      if (!is.null(domain)) {
        observe({
          selection <- private$.selectionCV$get()
          if (!is.null(selection) && length(selection) > 0) {
            self$.updateSelection(self$data(FALSE, FALSE)[[key]] %in% selection)
          } else {
            self$.updateSelection(NULL)
          }
        })
      }
    },
    transform = function(func) {
      SharedData$new(func(private$.data), key = private$.key, group = private$.group)
    },
    origData = function() {
      if (shiny::is.reactive(private$.data)) {
        private$.data()
      } else {
        private$.data
      }
    },
    groupName = function() {
      private$.group
    },
    key = function() {
      df <- if (shiny::is.reactive(private$.data)) {
        private$.data()
      } else {
        private$.data
      }

      if (!is.null(private$.key))
        df[[private$.key]]
      else if (!is.null(row.names(df)))
        row.names(df)
      else if (nrow(df) > 0)
        as.character(1:nrow(df))
      else
        character()
    },
    data = function(withSelection = FALSE, withFilter = TRUE, withKey = FALSE) {
      df <- if (shiny::is.reactive(private$.data)) {
        private$.data()
      } else {
        private$.data
      }

      op <- options(shiny.suppressMissingContextError = TRUE)
      on.exit(options(op), add = TRUE)

      if (withSelection) {
        if (is.null(private$.rv$selected) || length(private$.rv$selected) == 0) {
          df$selected_ = NA
        } else {
          # TODO: Warn if the length of _selected is different?
          df$selected_ <- private$.rv$selected
        }
      }

      if (withFilter) {
        if (!is.null(private$.filterCV$get())) {
          df <- df[self$key() %in% private$.filterCV$get(),]
        }
      }

      if (withKey) {
        df$key_ <- self$key()
      }

      df
    },
    # Public API for selection getting/setting. Setting a selection will
    # cause an event to be propagated to the client.
    selection = function(value, ownerId = "") {
      if (missing(value)) {
        return(private$.rv$selected)
      } else {
        # TODO: Should we even update the server at this time? Or do we
        # force all such events to originate in the client (much like
        # updateXXXInput)?

        # .updateSelection needs logical array of length nrow(data)
        # .selectionCV$sendUpdate needs character array of keys
        isolate({
          if (is.null(value)) {
            self$.updateSelection(NULL)
            private$.selectionCV$sendUpdate(NULL)
          } else {
            key <- self$key()
            if (is.character(value)) {
              self$.updateSelection(key %in% value)
              private$.selectionCV$sendUpdate(value)
            } else if (is.logical(value)) {
              self$.updateSelection(value)
              private$.selectionCV$sendUpdate(key[value])
            } else if (is.numeric(value)) {
              self$selection(1:nrow(self$data(FALSE)) %in% value)
            }
          }
        })
      }
    },
    clearSelection = function(ownerId = "") {
      self$selection(list(), ownerId = "")
    },
    # Update selection without sending event
    .updateSelection = function(value) {
      `$<-`(private$.rv, "selected", value)
    }
  )
)

#' @export
is.SharedData <- function(x) {
  inherits(x, "SharedData")
}
