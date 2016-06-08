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

ionrangesliderLibs <- function() {
  list(
    htmlDependency("ionrangeslider", "2.1.2",
      system.file("www/lib/ionrangeslider", package = "crosstalk"),
      script = "js/ion.rangeSlider.min.js",
      # ion.rangeSlider also needs normalize.css, which is already included in
      # Bootstrap.
      stylesheet = c("css/ion.rangeSlider.css",
        "css/ion.rangeSlider.skinShiny.css")
    ),
    htmlDependency("strftime", "0.9.2",
      system.file("www/lib/strftime", package = "crosstalk"),
      script = "strftime-min.js"
    )
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


#' Slider Input Widget
#'
#' Constructs a slider widget to select a numeric value from a range.
#'
#' @param inputId The \code{input} slot that will be used to access the value.
#' @param label Display label for teh control, or \code{NULL} for no label.
#' @param min The minimum value (inclusive) that can be selected.
#' @param max The maximum value (inclusive) that can be selected.
#' @param value The initial value of the slider. A numeric vector of length one
#'   will create a regular slider; a numeric vector of length two will create a
#'   double-ended range slider. A warning will be issued if the value doesn't
#'   fit between \code{min} and \code{max}.
#' @param step Specifies the interval between each selectable value on the
#'   slider (if \code{NULL}, a heuristic is used to determine the step size). If
#'   the values are dates, \code{step} is in days; if the values are times
#'   (POSIXt), \code{step} is in seconds.
#' @param round \code{TRUE} to round all values to the nearest integer;
#'   \code{FALSE} if no rounding is desired; or an integer to round to that
#'   number of digits (for example, 1 will round to the nearest 10, and -2 will
#'   round to the nearest .01). Any rounding will be applied after snapping to
#'   the nearest step.
#' @param ticks \code{FALSE} to hide tick marks, \code{TRUE} to show them
#'   according to some simple heuristics.
#' @param animate \code{TRUE} to show simple animation controls with default
#'   settings; \code{FALSE} not to; or a custom settings list, such as those
#'   created using \code{\link{animationOptions}}.
#' @param sep Separator between thousands places in numbers.
#' @param pre A prefix string to put in front of the value.
#' @param post A suffix string to put after the value.
#' @param dragRange This option is used only if it is a range slider (with two
#'   values). If \code{TRUE} (the default), the range can be dragged. In other
#'   words, the min and max can be dragged together. If \code{FALSE}, the range
#'   cannot be dragged.
#' @param timeFormat Only used if the values are Date or POSIXt objects. A time
#'   format string, to be passed to the Javascript strftime library. See
#'   \url{https://github.com/samsonjs/strftime} for more details. The allowed
#'   format specifications are very similar, but not identical, to those for R's
#'   \code{\link{strftime}} function. For Dates, the default is \code{"\%F"}
#'   (like \code{"2015-07-01"}), and for POSIXt, the default is \code{"\%F \%T"}
#'   (like \code{"2015-07-01 15:32:10"}).
#' @param timezone Only used if the values are POSIXt objects. A string
#'   specifying the time zone offset for the displayed times, in the format
#'   \code{"+HHMM"} or \code{"-HHMM"}. If \code{NULL} (the default), times will
#'   be displayed in the browser's time zone. The value \code{"+0000"} will
#'   result in UTC time.
#'
#' @examples
#' ## Only run examples in interactive R sessions
#' if (interactive()) {
#'
#' ui <- fluidPage(
#'   sliderInput("obs", "Number of observations:",
#'     min = 0, max = 1000, value = 500
#'   ),
#'   plotOutput("distPlot")
#' )
#'
#' # Server logic
#' server <- function(input, output) {
#'   output$distPlot <- renderPlot({
#'     hist(rnorm(input$obs))
#'   })
#' }
#'
#' # Complete app with UI and server components
#' shinyApp(ui, server)
#' }
#' @export
filter_slider <- function(inputId, label, sharedData, column, step = NULL,
  round = FALSE, ticks = TRUE, animate = FALSE, width = NULL, sep = ",",
  pre = NULL, post = NULL, timeFormat = NULL,
  timezone = NULL, dragRange = TRUE)
{
  # TODO: Check that this works well with factors
  # TODO: Handle empty data frame, NA/NaN/Inf/-Inf values

  df <- sharedData$data(withKey = TRUE)
  col <- df[[column]]
  values <- na.omit(col)
  min <- min(values)
  max <- max(values)
  value <- range(values)

  ord <- order(col)
  options <- list(
    values = col[ord],
    keys = df$key_[ord],
    group = sharedData$groupName()
  )

  # If step is NULL, use heuristic to set the step size.
  findStepSize <- function(min, max, step) {
    if (!is.null(step)) return(step)

    range <- max - min
    # If short range or decimals, use continuous decimal with ~100 points
    if (range < 2 || hasDecimals(min) || hasDecimals(max)) {
      step <- pretty(c(min, max), n = 100)
      step[2] - step[1]
    } else {
      1
    }
  }

  if (inherits(min, "Date")) {
    if (!inherits(max, "Date") || !inherits(value, "Date"))
      stop("`min`, `max`, and `value must all be Date or non-Date objects")
    dataType <- "date"

    if (is.null(timeFormat))
      timeFormat <- "%F"

  } else if (inherits(min, "POSIXt")) {
    if (!inherits(max, "POSIXt") || !inherits(value, "POSIXt"))
      stop("`min`, `max`, and `value must all be POSIXt or non-POSIXt objects")
    dataType <- "datetime"

    if (is.null(timeFormat))
      timeFormat <- "%F %T"

  } else {
    dataType <- "number"
  }

  step <- findStepSize(min, max, step)

  if (dataType %in% c("date", "datetime")) {
    # For Dates, this conversion uses midnight on that date in UTC
    to_ms <- function(x) 1000 * as.numeric(as.POSIXct(x))

    # Convert values to milliseconds since epoch (this is the value JS uses)
    # Find step size in ms
    step  <- to_ms(max) - to_ms(max - step)
    min   <- to_ms(min)
    max   <- to_ms(max)
    value <- to_ms(value)
  }

  range <- max - min

  # Try to get a sane number of tick marks
  if (ticks) {
    n_steps <- range / step

    # Make sure there are <= 10 steps.
    # n_ticks can be a noninteger, which is good when the range is not an
    # integer multiple of the step size, e.g., min=1, max=10, step=4
    scale_factor <- ceiling(n_steps / 10)
    n_ticks <- n_steps / scale_factor

  } else {
    n_ticks <- NULL
  }

  sliderProps <- dropNulls(list(
    `data-type` = if (length(value) > 1) "double",
    `data-min` = formatNoSci(min),
    `data-max` = formatNoSci(max),
    `data-from` = formatNoSci(value[1]),
    `data-to` = if (length(value) > 1) formatNoSci(value[2]),
    `data-step` = formatNoSci(step),
    `data-grid` = ticks,
    `data-grid-num` = n_ticks,
    `data-grid-snap` = FALSE,
    `data-prettify-separator` = sep,
    `data-prefix` = pre,
    `data-postfix` = post,
    `data-keyboard` = TRUE,
    `data-keyboard-step` = step / (max - min) * 100,
    `data-drag-interval` = dragRange,
    # The following are ignored by the ion.rangeSlider, but are used by Shiny.
    `data-data-type` = dataType,
    `data-time-format` = timeFormat,
    `data-timezone` = timezone
  ))

  # Replace any TRUE and FALSE with "true" and "false"
  sliderProps <- lapply(sliderProps, function(x) {
    if (identical(x, TRUE)) "true"
    else if (identical(x, FALSE)) "false"
    else x
  })

  sliderTag <- div(
    class = "form-group crosstalk-input-container",
    class = "crosstalk-input-slider js-range-slider",
    id = inputId,

    style = if (!is.null(width)) paste0("width: ", validateCssUnit(width), ";"),
    if (!is.null(label)) controlLabel(inputId, label),
    do.call(tags$input, sliderProps),
    tags$script(type = "application/json",
      `data-for` = inputId,
      jsonlite::toJSON(options, dataframe = "columns", pretty = TRUE)
    )
  )

  # Add animation buttons
  if (identical(animate, TRUE))
    animate <- animationOptions()

  if (!is.null(animate) && !identical(animate, FALSE)) {
    if (is.null(animate$playButton))
      animate$playButton <- icon('play', lib = 'glyphicon')
    if (is.null(animate$pauseButton))
      animate$pauseButton <- icon('pause', lib = 'glyphicon')

    sliderTag <- tagAppendChild(
      sliderTag,
      tags$div(class='slider-animate-container',
        tags$a(href='#',
          class='slider-animate-button',
          'data-target-id'=inputId,
          'data-interval'=animate$interval,
          'data-loop'=animate$loop,
          span(class = 'play', animate$playButton),
          span(class = 'pause', animate$pauseButton)
        )
      )
    )
  }

  attachDependencies(sliderTag,
    c(dependencies(), ionrangesliderLibs())
  )
}

hasDecimals <- function(value) {
  truncatedValue <- round(value)
  return (!identical(value, truncatedValue))
}

#' @rdname filter_slider
#'
#' @param interval The interval, in milliseconds, between each animation step.
#' @param loop \code{TRUE} to automatically restart the animation when it
#'   reaches the end.
#' @param playButton Specifies the appearance of the play button. Valid values
#'   are a one-element character vector (for a simple text label), an HTML tag
#'   or list of tags (using \code{\link{tag}} and friends), or raw HTML (using
#'   \code{\link{HTML}}).
#' @param pauseButton Similar to \code{playButton}, but for the pause button.
#'
#' @export
animation_options <- function(interval=1000,
  loop=FALSE,
  playButton=NULL,
  pauseButton=NULL) {
  list(interval=interval,
    loop=loop,
    playButton=playButton,
    pauseButton=pauseButton)
}

controlLabel <- function(controlName, label) {
  if (is.null(label)) {
    NULL
  } else {
    tags$label(class = "control-label", `for` = controlName, label)
  }
}

# Given a vector or list, drop all the NULL items in it
dropNulls <- function(x) {
  x[!vapply(x, is.null, FUN.VALUE=logical(1))]
}

# Format a number without sci notation, and keep as many digits as possible (do
# we really need to go beyond 15 digits?)
formatNoSci <- function(x) {
  if (is.null(x)) return(NULL)
  format(x, scientific = FALSE, digits = 15)
}
