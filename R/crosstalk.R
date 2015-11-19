#' @import htmltools
init <- function() {
  htmltools::attachDependencies(
    list(dependency),
  )
}

#' @export
dependency <- htmltools::htmlDependency("crosstalk", packageVersion("crosstalk"),
  src = system.file("www", package = "crosstalk"),
  script = "js/crosstalk.js"
)


#' @import R6
#' @export
ClientValue <- R6Class(
  "ClientValue",
  private = list(
    .session = "ANY",
    .name = "ANY",
    .qualifiedName = "ANY",
    .rv = "ANY"
  ),
  public = list(
    initialize = function(name, session = shiny::getDefaultReactiveDomain()) {
      private$.session <- session
      private$.name <- name
      private$.qualifiedName <- paste0(".clientValue-", name)
    },
    get = function() {
      private$.session$input[[private$.qualifiedName]]
    },
    sendUpdate = function(value) {
      private$.session$sendCustomMessage("update-client-value", list(
        name = private$.name,
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
    .rv = "ANY",
    .group = "ANY"
  ),
  public = list(
    initialize = function(data, key, interactionMode = "select", group = "default") {
      private$.data <- data
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
          selection <- domain$input[[paste0(group, "-crosstalk-selection")]]
          if (!is.null(selection)) {
            if (length(selection$observations) > 0) {
              self$.updateSelection(isolate(self$data(FALSE))[[key]] %in% selection$observations)
            } else {
              self$.updateSelection(NULL)
            }
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
          df <- cbind(df, `_selected` = NA)
        } else {
          # TODO: Warn if the length of _selected is different?
          df <- cbind(df, `_selected` = private$.rv$selected)
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
        self$.updateSelection(value)
        domain <- shiny::getDefaultReactiveDomain()
        if (!is.null(domain)) {
          domain$sendCustomMessage("crosstalk-selection", list(
            group = private$.group,
            ownerId = ownerId,
            observations = value
          ))
        }
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
