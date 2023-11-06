# @staticimports pkg:staticimports
#  is_installed get_package_version system_file

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
      version = get_package_version("crosstalk"),
      package = "crosstalk",
      src = "www",
      script = "js/crosstalk.min.js",
      stylesheet = "css/crosstalk.min.css"
    )
  )
}

#' ClientValue object
#'
#' @description
#' An object that can be used in a \href{https://shiny.posit.co/}{Shiny} server
#' function to get or set a crosstalk variable that exists on the client. The
#' client copy of the variable is the canonical copy, so there is no direct
#' "set" method that immediately changes the value; instead, there is a
#' `sendUpdate` method that sends a request to the browser to change the value,
#' which will then cause the new value to be relayed back to the server.
#'
#' This object is used to implement \code{\link{SharedData}} and should not need
#' to be used directly by users.
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
#' @import R6
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
    #' @description
    #' Creates a new ClientValue object to reflect the crosstalk variable
    #' specified by `group` and `name`.
    #'
    #' @param name The name of the crosstalk variable.
    #' @param group The name of the crosstalk variable group.
    #' @param session The Shiny session to connect to; defaults to the current
    #'   session.
    initialize = function(name, group = "default", session = shiny::getDefaultReactiveDomain()) {
      if (!missing(session) || shinyInstalled()) {
        if (!is.null(session)) {
          # The name and group should be interpreted as global to the session,
          # i.e. SharedData in two module instances with the same group name
          # should be linked. Use the rootScope(), or else get() will prepend
          # the module ID.
          session <- session$rootScope()
        }
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

    #' @description
    #' Read the value. This is a reactive operation akin to reading a reactive
    #' value, and so can only be done in a reactive context (e.g. in a
    #' `shiny::reactive()`, `shiny::observe()`, or `shiny::isolate()` block).
    get = function() {
      private$.session$input[[private$.qualifiedName]]
    },

    #' @description
    #' Send a message to the browser asking it to update the crosstalk var to
    #' the given value. This update does not happen synchronously, that is, a
    #' call to `get()` immediately following `sendUpdate(value)` will not
    #' reflect the new value.
    #' @param value The new value for the crosstalk variable. Must be
    #'   serializable as JSON using `jsonlite`.
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


#' Shared data frame
#'
#' @description
#' An R6 class that represents a shared data frame, or sufficiently data
#' frame-like object.
#'
#' The primary use for \code{SharedData} is to be passed to Crosstalk-compatible
#' widgets in place of a data frame. Each \code{SharedData$new(...)} call makes
#' a new "group" of widgets that link to each other, but not to widgets in other
#' groups. You can also use a \code{SharedData} object from Shiny code in order
#' to react to filtering and brushing from non-widget visualizations (like
#' ggplot2 plots).
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
    .group = "ANY",
    # Update selection without sending event
    .updateSelection = function(value) {
      force(value)
      `$<-`(private$.rv, "selected", value)
    }
  ),
  public = list(
    #' @param data A data frame-like object, or a Shiny
    #'   \link[shiny:reactive]{reactive expression} that returns a data
    #'   frame-like object.
    #' @param key Character vector or one-sided formula that indicates the name
    #'   of the column that represents the key or ID of the data frame. These
    #'   \emph{must} be unique, and ideally will be something intrinsic to the
    #'   data (a proper ID) rather than a transient property like row index.
    #'
    #'   If \code{NULL}, then \code{row.names(data)} will be used.
    #' @param group The "identity" of the Crosstalk group that widgets will join
    #'   when you pass them this \code{SharedData} object. In some cases, you
    #'   will want to have multiple independent \code{SharedData} objects link
    #'   up to form a single web of widgets that all share selection and
    #'   filtering state; in those cases, you'll give those \code{SharedData}
    #'   objects the same group name. (One example: in Shiny, ui.R and server.R
    #'   might each need their own \code{SharedData} instance, even though
    #'   they're intended to represent a single group.)
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
        shiny::observe({
          selection <- private$.selectionCV$get()
          if (!is.null(selection) && length(selection) > 0) {
            private$.updateSelection(self$key() %in% selection)
          } else {
            private$.updateSelection(NULL)
          }
        })
      }
    },
    #' @description Return the data frame that was used to create this
    #' \code{SharedData} instance. If a reactive expression, evaluate the
    #' reactive expression. Equivalent to \code{SharedData$data(FALSE, FALSE,
    #' FALSE)}.
    origData = function() {
      if (is.reactive(private$.data)) {
        private$.data()
      } else {
        private$.data
      }
    },
    #' @description Returns the value of \code{group} that was used to create
    #' this instance.
    groupName = function() {
      private$.group
    },
    #' @description Returns the vector of key values. Filtering is not applied.
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
    #' @description
    #' Return the data (or read and return the data if the data is a Shiny
    #' reactive expression).
    #'
    #' When running in Shiny, calling \code{data()} is a reactive operation that
    #' will invalidate if the selection or filter change (assuming that
    #' information was requested), or if the original data is a reactive
    #' expression that has invalidated.
    #' @param withSelection If `TRUE`, add a \code{selection_} column with
    #'   logical values indicating which rows are in the current selection, or
    #'   \code{NA} if no selection is currently active.
    #' @param withFilter If `TRUE` (the default), only return rows that are part
    #'   of the current filter settings, if any.
    #' @param withKey If `TRUE`, add a \code{key_} column with the key values of
    #'   each row (normally not needed since the key is either one of the other
    #'   columns or else just the row names).
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
    #' @description Get or set the current selection in the client.
    #'
    #' If called without arguments, returns a logical vector of rows that are
    #' currently selected (brushed), or \code{NULL} if no selection exists.
    #' Intended to be called from a Shiny reactive context, and invalidates
    #' whenever the selection changes.
    #'
    #' If called with one or two arguments, sets the selection based on the
    #' given value indirectly, by sending the value to the web browser (assumes
    #' an active Shiny app or Shiny R Markdown document).
    #'
    #' @param value If provided, a logical vector of `nrow(origData())` length,
    #'   indicating which rows are currently selected (brushed).
    #'
    #' @param ownerId Set this argument to the `outputId` of a widget if
    #'   conceptually that widget "initiated" the selection (prevents that
    #'   widget from clearing its visual selection box, which is normally
    #'   cleared when the selection changes). For example, if setting the
    #'   selection based on a [shiny::plotOutput()] brush, then
    #'   `ownerId` should be the `outputId` of that `plotOutput`.
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
            private$.updateSelection(NULL)
            private$.selectionCV$sendUpdate(NULL)
          } else {
            key <- self$key()
            if (is.character(value)) {
              private$.updateSelection(key %in% value)
              private$.selectionCV$sendUpdate(value)
            } else if (is.logical(value)) {
              private$.updateSelection(value)
              private$.selectionCV$sendUpdate(key[value])
            } else if (is.numeric(value)) {
              self$selection(1:nrow(self$data(FALSE)) %in% value)
            }
          }
        })
      }
    },
    #' @description Clears the selection indirectly, by sending an instruction
    #' to the client that it should do so.
    #'
    #' @param ownerId See the [SharedData$selection()] method.
    clearSelection = function(ownerId = "") {
      stopIfNotShiny("SharedData$clearSelection() requires the shiny package")
      self$selection(list(), ownerId = "")
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
