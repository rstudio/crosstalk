#' @import htmltools
init <- function() {
  htmltools::attachDependencies(
    list(),
    crosstalkLibs()
  )
}

#' Crosstalk dependencies
#'
#' List of \code{\link[htmltools]{htmlDependency}} objects necessary for
#' Crosstalk to function. Intended for widget authors.
#' @importFrom stats na.omit setNames
#' @importFrom utils packageVersion
#' @export
crosstalkLibs <- function() {
  list(
    jqueryLib(),
    htmltools::htmlDependency(
      name = "crosstalk",
      version = packageVersion("crosstalk"),
      package = "crosstalk",
      src = "www",
      script = "js/crosstalk.min.js",
      stylesheet = "css/crosstalk.css"
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
      if (!missing(session) || shinyInstalled()) {
        private$.session <- session
      } else {
        # If session wasn't explicitly provided and Shiny isn't installed, we can't use
        # the default value for session because it uses a shiny:: function. Instead,
        # set it to NULL. This is hacky and weird but ClientValue doesn't really need
        # to work well if Shiny isn't installed, it just needs to not throw.
        private$.session <- NULL
      }
      private$.name <- name
      private$.group <- group
      private$.qualifiedName <- paste0(".clientValue-", group, "-", name)
    },
    get = function() {
      private$.session$input[[private$.qualifiedName]]
    },
    sendUpdate = function(value) {
      stopIfNotShiny("ClientValue$sendUpdate() requires the shiny package")
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


#' An R6 class that represents a shared data frame
#'
#' ...or sufficiently data frame-like object. The primary use for
#' \code{SharedData} is to be passed to Crosstalk-compatible widgets in place
#' of a data frame. Each \code{SharedData$new(...)} call makes a new "group"
#' of widgets that link to each other, but not to widgets in other groups.
#' You can also use a \code{SharedData} object from Shiny code in order to
#' react to filtering and brushing from non-widget visualizations (like ggplot2
#' plots).
#'
#' @section Constructor:
#'
#' \code{SharedData$new(data, key = NULL, group = createUniqueId(4, prefix = "SharedData"))}
#'
#' \describe{
#'   \item{\code{data}}{
#'     A data frame-like object, or a Shiny \link[shiny:reactive]{reactive
#'     expression} that returns a data frame-like object.
#'   }
#'   \item{\code{key}}{
#'     Character vector or one-sided formula that indicates the name of the
#'     column that represents the key or ID of the data frame. These \emph{must}
#'     be unique, and ideally will be something intrinsic to the data (a proper
#'     ID) rather than a transient property like row index.
#'
#'     If \code{NULL}, then \code{row.names(data)} will be used.
#'   }
#'   \item{\code{group}}{
#'     The "identity" of the Crosstalk group that widgets will join when you
#'     pass them this \code{SharedData} object. In some cases, you will want to
#'     have multiple independent \code{SharedData} objects link up to form a
#'     single web of widgets that all share selection and filtering state; in
#'     those cases, you'll give those \code{SharedData} objects the same group
#'     name. (One example: in Shiny, ui.R and server.R might each need their own
#'     \code{SharedData} instance, even though they're intended to represent a
#'     single group.)
#'   }
#' }
#'
#' @section Methods:
#'
#' \describe{
#'   \item{\code{data(withSelection = FALSE, withFilter = TRUE, withKey = FALSE)}}{
#'     Return the data (or read and return the data if the data is a Shiny
#'     reactive expression). If \code{withSelection}, add a \code{selection_}
#'     column with logical values indicating which rows are in the current
#'     selection, or \code{NA} if no selection is currently active. If
#'     \code{withFilter} (the default), only return rows that are part of the
#'     current filter settings, if any. If \code{withKey}, add a \code{key_}
#'     column with the key values of each row (normally not needed since the
#'     key is either one of the other columns or else just the row names).
#'
#'     When running in Shiny, calling \code{data()} is a reactive operation
#'     that will invalidate if the selection or filter change (assuming that
#'     information was requested), or if the original data is a reactive
#'     expression that has invalidated.
#'   }
#'   \item{\code{origData()}}{
#'     Return the data frame that was used to create this \code{SharedData}
#'     instance. If a reactive expression, evaluate the reactive expression.
#'     Equivalent to \code{data(FALSE, FALSE, FALSE)}.
#'   }
#'   \item{\code{groupName()}}{
#'     Returns the value of \code{group} that was used to create this instance.
#'   }
#'   \item{\code{key()}}{
#'     Returns the vector of key values. Filtering is not applied.
#'   }
#'   \item{\code{selection(value, ownerId = "")}}{
#'     If called without arguments, returns a logical vector of rows that are
#'     currently selected (brushed), or \code{NULL} if no selection exists.
#'     Intended to be called from a Shiny reactive context, and invalidates
#'     whenever the selection changes.
#'
#'     If called with one or two arguments, expects \code{value} to be a logical
#'     vector of \code{nrow(origData())} length, indicating which rows are
#'     currently selected (brushed). This value is propagated to the web browser
#'     (assumes an active Shiny app or Shiny R Markdown document).
#'
#'     Set the \code{ownerId} argument to the \code{outputId} of a widget if
#'     conceptually that widget "initiated" the selection (prevents that widget
#'     from clearing its visual selection box, which is normally cleared when
#'     the selection changes). For example, if setting the selection based on a
#'     \code{\link[shiny]{plotOutput}} brush, then \code{ownerId} should be the
#'     \code{outputId} of the \code{plotOutput}.
#'   }
#'   \item{\code{clearSelection(ownerId = "")}}{
#'     Clears the selection. For the meaning of \code{ownerId}, see the
#'     \code{selection} method.
#'   }
#' }
#'
#' @import R6
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
      private$.filterCV <- ClientValue$new("filter", group)
      private$.selectionCV <- ClientValue$new("selection", group)
      private$.rv <- reactiveValues()
      private$.group <- group

      if (inherits(key, "formula")) {
        private$.key <- key
      } else if (is.character(key)) {
        private$.key <- key
      } else if (is.function(key)) {
        private$.key <- key
      } else if (is.null(key)) {
        private$.key <- key
      } else {
        stop("Unknown key type")
      }

      if (is.reactive(private$.data)) {
        shiny::observeEvent(private$.data(), {
          self$clearSelection()
        })
      }

      domain <- getDefaultReactiveDomain()
      if (!is.null(domain)) {
        observe({
          selection <- private$.selectionCV$get()
          if (!is.null(selection) && length(selection) > 0) {
            self$.updateSelection(self$key() %in% selection)
          } else {
            self$.updateSelection(NULL)
          }
        })
      }
    },
    origData = function() {
      if (is.reactive(private$.data)) {
        private$.data()
      } else {
        private$.data
      }
    },
    groupName = function() {
      private$.group
    },
    key = function() {
      df <- if (is.reactive(private$.data)) {
        private$.data()
      } else {
        private$.data
      }

      key <- private$.key
      if (inherits(key, "formula"))
        lazyeval::f_eval(key, df)
      else if (is.character(key))
        key
      else if (is.function(key))
        key(df)
      else if (!is.null(row.names(df)))
        row.names(df)
      else if (nrow(df) > 0)
        as.character(1:nrow(df))
      else
        character()
    },
    data = function(withSelection = FALSE, withFilter = TRUE, withKey = FALSE) {
      df <- if (is.reactive(private$.data)) {
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

      if (withKey) {
        df$key_ <- self$key()
      }

      if (withFilter) {
        if (!is.null(private$.filterCV$get())) {
          df <- df[self$key() %in% private$.filterCV$get(),]
        }
      }

      df
    },
    # Public API for selection getting/setting. Setting a selection will
    # cause an event to be propagated to the client.
    selection = function(value, ownerId = "") {
      stopIfNotShiny("SharedData$selection() requires the shiny package")

      if (missing(value)) {
        return(private$.rv$selected)
      } else {
        # TODO: Should we even update the server at this time? Or do we
        # force all such events to originate in the client (much like
        # updateXXXInput)?

        # .updateSelection needs logical array of length nrow(data)
        # .selectionCV$sendUpdate needs character array of keys
        shiny::isolate({
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
      stopIfNotShiny("SharedData$clearSelection() requires the shiny package")
      self$selection(list(), ownerId = "")
    },
    # Update selection without sending event
    .updateSelection = function(value) {
      force(value)
      `$<-`(private$.rv, "selected", value)
    }
  )
)

#' Check if an object is \code{SharedData}
#'
#' Check if an object is an instance of \code{\link{SharedData}} or not.
#'
#' @param x The object that may or may not be an instance of \code{SharedData}
#' @return logical
#'
#' @export
is.SharedData <- function(x) {
  inherits(x, "SharedData")
}
