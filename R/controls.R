bootstrapLib <- function(theme = NULL) {
  htmlDependency("bootstrap", "3.3.6",
    system.file("www/lib/bootstrap", package = "crosstalk"),
    script = c(
      "js/bootstrap.min.js",
      # These shims are necessary for IE 8 compatibility
      "shim/html5shiv.min.js",
      "shim/respond.min.js"
    ),
    stylesheet = if (is.null(theme)) "css/bootstrap.min.css",
    meta = list(viewport = "width=device-width, initial-scale=1")
  )
}

selectizeLib <- function(bootstrap = TRUE) {
  htmlDependency(
    "selectize", "0.11.2",
    system.file("www/lib/selectize", package = "crosstalk"),
    stylesheet = if (bootstrap) "css/selectize.bootstrap3.css",
    script = "js/selectize.min.js"
  )
}

jqueryLib <- function() {
  htmlDependency(
    "jquery", "1.11.3",
    system.file("www/lib/jquery", package = "crosstalk"),
    script = "jquery.min.js"
  )
}

makeGroupOptions <- function(sharedData, group, allLevels) {
  df <- sharedData$data(
    withSelection = FALSE,
    withFilter = FALSE,
    withKey = TRUE
  )

  df <- df %>%
    dplyr::group_by_(group = group) %>%
    dplyr::summarise(key = list(key_))

  if (is.factor(df$g) && allLevels) {
    labels <- as.character(levels(df$g))
    values <- as.character(levels(df$g))
  } else {
    labels <- as.character(df$g)
    values <- as.character(df$g)
  }

  options <- list(
    items = data.frame(value = values, label = labels, stringsAsFactors = FALSE),
    map = setNames(as.list(df$key), as.character(df$g)),
    group = sharedData$groupName()
  )

  options
}

#' @export
filter_select <- function(id, label, sharedData, group, allLevels = FALSE,
  multiple = TRUE) {

  options <- makeGroupOptions(sharedData, group, allLevels)

  attachDependencies(
    tags$div(id = id, class = "form-group crosstalk-input-select crosstalk-input",
      tags$label(class = "control-label", `for` = id, label),
      tags$div(
        tags$select(
          multiple = if (multiple) NA else NULL
        ),
        tags$script(type = "application/json",
          `data-for` = id,
          jsonlite::toJSON(options, dataframe = "columns", pretty = TRUE)
        )
      )
    ),
    c(dependencies(), list(jqueryLib(), bootstrapLib(), selectizeLib()))
  )
}

#' @export
filter_checkbox <- function(id, label, sharedData, group, allLevels = FALSE) {
  options <- makeGroupOptions(sharedData, group, allLevels)

  labels <- options$items$label
  values <- options$items$value
  options$items <- NULL # Doesn't need to be serialized for this type of control

  attachDependencies(
    tags$div(id = id, class = "form-group crosstalk-input-checkboxgroup crosstalk-input",
      tags$label(class = "control-label", `for` = id, label),
      tags$div(class = "crosstalk-options-group",
        mapply(labels, values, FUN = function(label, value) {
          tags$div(class = "checkbox",
            tags$label(
              tags$input(type = "checkbox", name = id, value = value),
              tags$span(label)
            )
          )
        }, SIMPLIFY = FALSE, USE.NAMES = FALSE)
      ),
      tags$script(type = "application/json",
        `data-for` = id,
        jsonlite::toJSON(options, dataframe = "columns", pretty = TRUE)
      )
    ),
    c(dependencies(), list(jqueryLib(), bootstrapLib()))
  )
}
