#' @import htmltools
init <- function() {
  htmltools::attachDependencies(
    list(),
    dependencies
  )
}

#' @export
dependencies <- list(
  htmltools::htmlDependency("crosstalk", packageVersion("crosstalk"),
    src = system.file("www", package = "crosstalk"),
    script = "js/crosstalk.js"
  )
)

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



#' @import R6
#' @export
SharedData <- R6Class(
  "SharedData",
  private = list(
    .data = "ANY",
    .key = "ANY",
    .selectionCV = "ANY",
    .rv = "ANY",
    .group = "ANY"
  ),
  public = list(
    initialize = function(data, key, interactionMode = "select", group = "default") {
      private$.data <- data
      private$.key <- key
      private$.selectionCV <- ClientValue$new("selection", group)
      private$.rv <- reactiveValues()
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
            self$.updateSelection(isolate(self$data(FALSE))[[key]] %in% selection)
          } else {
            self$.updateSelection(NULL)
          }
        })
      }
    },
    groupName = function() {
      private$.group
    },
    data = function(withSelection = FALSE) {
      df <- if (shiny::is.reactive(private$.data)) {
        private$.data()
      } else {
        private$.data
      }

      if (withSelection) {
        if (is.null(private$.rv$selected) || length(private$.rv$selected) == 0) {
          df <- cbind(df, selected_ = NA)
        } else {
          # TODO: Warn if the length of _selected is different?
          df <- cbind(df, selected_ = private$.rv$selected)
        }
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
          } else if (is.character(value)) {
            self$.updateSelection(self$data(FALSE)[[private$.key]] %in% value)
            private$.selectionCV$sendUpdate(value)
          } else if (is.logical(value)) {
            self$.updateSelection(value)
            private$.selectionCV$sendUpdate(self$data(FALSE)[[private$.key]][value])
          } else if (is.numeric(value)) {
            self$selection(1:nrow(self$data(FALSE)) %in% value)
            private$.selectionCV$sendUpdate(self$data(FALSE)[[private$.key]][value])
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
