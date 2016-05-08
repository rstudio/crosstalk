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
    head = format(tagList(
      HTML('<!--[if lt IE 9]>'),
      tags$script(src = 'shared/selectize/js/es5-shim.min.js'),
      HTML('<![endif]-->'),
      tags$script(src = 'shared/selectize/js/selectize.min.js')
    ))
  )
}

jqueryLib <- function() {
  htmlDependency(
    "jquery", "1.11.3",
    system.file("www/lib/jquery", package = "crosstalk"),
    script = "jquery.min.js"
  )
}

#' @export
filter_select <- function(id, label, sharedData, group, allLevels = FALSE,
  multiple = TRUE) {

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
    values <- as.character(as.numeric(levels(df$g)))
  } else {
    labels <- as.character(df$g)
    values <- as.character(df$g)
    if (is.factor(df$g)) {
      values <- as.character(as.numeric(df$g))
    }
  }

  options <- list(
    items = data.frame(value = values, label = labels, stringsAsFactors = FALSE),
    map = setNames(as.list(df$key), df$g),
    group = sharedData$groupName()
  )

  attachDependencies(
    tagList(
      tags$div(id = id, class = "crosstalk-input-select crosstalk-input",
        tags$select(multiple = if (multiple) NA else NULL,
          # HTML(paste0(
          #   "<option value=\"",
          #   htmltools::htmlEscape(values, TRUE),
          #   "\">",
          #   htmltools::htmlEscape(labels, FALSE),
          #   "</option>",
          #   collapse = "\n"
          # )),
          NULL
        ),
        tags$script(type = "application/json",
          `data-for` = id,
          jsonlite::toJSON(options, dataframe = "columns", pretty = TRUE)
        )
      )
    ),
    list(jqueryLib(), bootstrapLib(), selectizeLib())
  )
}
