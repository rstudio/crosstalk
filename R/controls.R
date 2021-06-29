bootstrapGrid <- function() {
  htmlDependency(
    name = "bootstrap-grid",
    version = "3.4.1", # must be updated with tools/updateBootstrapGrid.R
    package = "crosstalk",
    src = "lib/bootstrap",
    stylesheet = "bootstrap-grid.min.css",
    meta = list(viewport = "width=device-width, initial-scale=1")
  )
}

selectizeLib <- function(bootstrap = TRUE) {
  htmlDependency(
    name = "selectize",
    version = "0.12.4",
    package = "crosstalk",
    src = "lib/selectize",
    stylesheet = if (bootstrap) "css/selectize.bootstrap3.css",
    script = "js/selectize.min.js"
  )
}

jqueryLib <- function() {
  htmlDependency(
    name = "jquery",
    version = "3.5.1",
    package = "crosstalk",
    src = "lib/jquery",
    script = "jquery.min.js"
  )
}

# Essentially the same as shiny:::ionRangeSliderDependency()
ionRangeSliderLibs <- function() {
  list(
    jqueryLib(),
    htmlDependency(
      "ionrangeslider-javascript",
      ionRangeSliderVersion,
      package = "crosstalk",
      src = "lib/ionrangeslider",
      script = "js/ion.rangeSlider.min.js",
    ),
    htmlDependency(
      name = "strftime",
      version = "0.9.2",
      package = "crosstalk",
      src = "lib/strftime",
      script = "strftime-min.js"
    ),
    if (is_available("bslib")) {
      bslib::bs_dependency_defer(ionRangeSliderDependencyCSS)
    } else {
      ionRangeSliderDependencyCSS()
    }
  )
}

ionRangeSliderDependencyCSS <- function(theme = NULL) {
  if (!is_bs_theme(theme)) {
    return(htmlDependency(
      "ionrangeslider-css",
      ionRangeSliderVersion,
      package = "crosstalk",
      src = "lib/ionrangeslider",
      stylesheet = "css/ion.rangeSlider.css"
    ))
  }

  bslib::bs_dependency(
    input = list(
      list(accent = "$component-active-bg"),
      sass::sass_file(
        system.file(package = "crosstalk", "lib/ionrangeslider/scss/shiny.scss")
      )
    ),
    theme = theme,
    name = "ionrangeslider-css",
    version = ionRangeSliderVersion,
    cache_key_extra = fastPackageVersion("crosstalk")
  )
}

ionRangeSliderVersion <- "2.3.1"

is_bs_theme <- function(x) {
  is_available("bslib") && bslib::is_bs_theme(x)
}


makeGroupOptions <- function(sharedData, group, allLevels) {
  df <- sharedData$data(
    withSelection = FALSE,
    withFilter = FALSE,
    withKey = TRUE
  )

  if (inherits(group, "formula"))
    group <- lazyeval::f_eval(group, df)

  if (length(group) < 1) {
    stop("Can't form options with zero-length group vector")
  }

  lvls <- if (is.factor(group)) {
    if (allLevels) {
      levels(group)
    } else {
      levels(droplevels(group))
    }
  } else {
    sort(unique(group))
  }
  matches <- match(group, lvls)
  vals <- lapply(1:length(lvls), function(i) {
    df$key_[which(matches == i)]
  })

  lvls_str <- as.character(lvls)

  options <- list(
    items = data.frame(value = lvls_str, label = lvls_str, stringsAsFactors = FALSE),
    map = setNames(vals, lvls_str),
    group = sharedData$groupName()
  )

  options
}

#' Categorical filter controls
#'
#' Creates a select box or list of checkboxes, for filtering a
#' \code{\link{SharedData}} object based on categorical data.
#'
#' @param id An HTML element ID; must be unique within the web page
#' @param label A human-readable label
#' @param sharedData \code{SharedData} object with the data to filter
#' @param group A one-sided formula whose values will populate this select box.
#'   Generally this should be a character or factor column; if not, it will be
#'   coerced to character.
#' @param allLevels If the vector described by \code{group} is factor-based,
#'   should all the levels be displayed as options, or only ones that are
#'   present in the data?
#' @param multiple Can multiple values be selected?
#' @param columns Number of columns the options should be arranged into.
#'
#' @examples
#' ## Only run examples in interactive R sessions
#' if (interactive()) {
#'
#' sd <- SharedData$new(chickwts)
#' filter_select("feedtype", "Feed type", sd, "feed")
#'
#' }
#'
#' @export
filter_select <- function(id, label, sharedData, group, allLevels = FALSE,
  multiple = TRUE) {

  options <- makeGroupOptions(sharedData, group, allLevels)

  htmltools::browsable(attachDependencies(
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
    c(list(jqueryLib(), selectizeLib()), crosstalkLibs())
  ))
}

columnize <- function(columnCount, elements) {
  if (columnCount <= 1 || length(elements) <= 1) {
    return(elements)
  }

  columnSize <- ceiling(length(elements) / columnCount)
  lapply(1:ceiling(length(elements) / columnSize), function(i) {
    tags$div(class = "crosstalk-options-column",
      {
        start <- (i-1) * columnSize + 1
        end <- i * columnSize
        elements[start:end]
      }
    )
  })
}

#' @param inline If \code{TRUE}, render checkbox options horizontally instead of vertically.
#'
#' @rdname filter_select
#' @export
filter_checkbox <- function(id, label, sharedData, group, allLevels = FALSE, inline = FALSE, columns = 1) {
  options <- makeGroupOptions(sharedData, group, allLevels)

  labels <- options$items$label
  values <- options$items$value
  options$items <- NULL # Doesn't need to be serialized for this type of control

  makeCheckbox <- if (inline) inlineCheckbox else blockCheckbox

  htmltools::browsable(attachDependencies(
    tags$div(id = id, class = "form-group crosstalk-input-checkboxgroup crosstalk-input",
      tags$label(class = "control-label", `for` = id, label),
      tags$div(class = "crosstalk-options-group",
        columnize(columns,
          mapply(labels, values, FUN = function(label, value) {
            makeCheckbox(id, value, label)
          }, SIMPLIFY = FALSE, USE.NAMES = FALSE)
        )
      ),
      tags$script(type = "application/json",
        `data-for` = id,
        jsonlite::toJSON(options, dataframe = "columns", pretty = TRUE)
      )
    ),
    c(list(jqueryLib()), crosstalkLibs())
  ))
}

blockCheckbox <- function(id, value, label) {
  tags$div(class = "checkbox",
    tags$label(
      tags$input(type = "checkbox", name = id, value = value),
      tags$span(label)
    )
  )
}

inlineCheckbox <- function(id, value, label) {
  tags$label(class = "checkbox-inline",
    tags$input(type = "checkbox", name = id, value = value),
    tags$span(label)
  )
}

#' Range filter control
#'
#' Creates a slider widget that lets users filter observations based on a range
#' of values.
#'
#' @param id An HTML element ID; must be unique within the web page
#' @param label A human-readable label
#' @param sharedData \code{SharedData} object with the data to filter
#' @param column A one-sided formula whose values will be used for this slider.
#'   The column must be of type \code{\link{Date}}, \code{\link{POSIXt}}, or
#'   numeric.
#' @param step Specifies the interval between each selectable value on the
#'   slider (if \code{NULL}, a heuristic is used to determine the step size). If
#'   the values are dates, \code{step} is in days; if the values are times
#'   (POSIXt), \code{step} is in seconds.
#' @param round \code{TRUE} to round all values to the nearest integer;
#'   \code{FALSE} if no rounding is desired; or an integer to round to that
#'   number of decimal places (for example, 1 will round to the nearest 0.1, and
#'   -2 will round to the nearest 100). Any rounding will be applied after
#'   snapping to the nearest step.
#' @param ticks \code{FALSE} to hide tick marks, \code{TRUE} to show them
#'   according to some simple heuristics.
#' @param animate \code{TRUE} to show simple animation controls with default
#'   settings; \code{FALSE} not to; or a custom settings list, such as those
#'   created using \code{\link[shiny]{animationOptions}}.
#' @param width The width of the slider control (see
#'   \code{\link[htmltools]{validateCssUnit}} for valid formats)
#' @param sep Separator between thousands places in numbers.
#' @param pre A prefix string to put in front of the value.
#' @param post A suffix string to put after the value.
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
#' @param dragRange This option is used only if it is a range slider (with two
#'   values). If \code{TRUE} (the default), the range can be dragged. In other
#'   words, the min and max can be dragged together. If \code{FALSE}, the range
#'   cannot be dragged.
#' @param min The leftmost value of the slider. By default, set to the minimal
#'   number in input data.
#' @param max The rightmost value of the slider. By default, set to the maximal
#'   number in input data.
#' @examples
#' ## Only run examples in interactive R sessions
#' if (interactive()) {
#'
#' sd <- SharedData$new(mtcars)
#' filter_slider("mpg", "Miles per gallon", sd, "mpg")
#'
#' }
#' @export
filter_slider <- function(id, label, sharedData, column, step = NULL,
  round = FALSE, ticks = TRUE, animate = FALSE, width = NULL, sep = ",",
  pre = NULL, post = NULL, timeFormat = NULL,
  timezone = NULL, dragRange = TRUE, min = NULL, max = NULL)
{
  # TODO: Check that this works well with factors
  # TODO: Handle empty data frame, NA/NaN/Inf/-Inf values

  if (is.character(column)) {
    column <- lazyeval::f_new(as.symbol(column))
  }

  df <- sharedData$data(withKey = TRUE)
  col <- lazyeval::f_eval(column, df)
  values <- na.omit(col)
  if (is.null(min))
    min <- min(values)
  if (is.null(max))
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

  if (isTRUE(round))
    round <- 0
  else if (!is.numeric(round))
    round <- NULL
  step <- findStepSize(min, max, step)
  # Avoid ugliness from floating point errors, e.g.
  # findStepSize(min(quakes$mag), max(quakes$mag), NULL)
  # was returning 0.01999999999999957 instead of 0.2
  step <- signif(step, 14)

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
    `data-skin` = "shiny",
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
    `data-round` = round,
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
    class = "form-group crosstalk-input",
    class = "crosstalk-input-slider js-range-slider",
    id = id,

    style = if (!is.null(width)) paste0("width: ", validateCssUnit(width), ";"),
    if (!is.null(label)) controlLabel(id, label),
    do.call(tags$input, sliderProps),
    tags$script(type = "application/json",
      `data-for` = id,
      jsonlite::toJSON(options, dataframe = "columns", pretty = TRUE)
    )
  )

  # Add animation buttons
  if (identical(animate, TRUE))
    animate <- shiny::animationOptions()

  if (!is.null(animate) && !identical(animate, FALSE)) {
    if (is.null(animate$playButton))
      animate$playButton <- shiny::icon('play', lib = 'glyphicon')
    if (is.null(animate$pauseButton))
      animate$pauseButton <- shiny::icon('pause', lib = 'glyphicon')

    sliderTag <- tagAppendChild(
      sliderTag,
      tags$div(class='slider-animate-container',
        tags$a(href='#',
          class='slider-animate-button',
          'data-target-id'=id,
          'data-interval'=animate$interval,
          'data-loop'=animate$loop,
          span(class = 'play', animate$playButton),
          span(class = 'pause', animate$pauseButton)
        )
      )
    )
  }

  htmltools::browsable(attachDependencies(
    sliderTag,
    c(ionRangeSliderLibs(), crosstalkLibs())
  ))
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

#' Arrange HTML elements or widgets in Bootstrap columns
#'
#' This helper function makes it easy to put HTML elements side by side. It can
#' be called directly from the console but is especially designed to work in an
#' R Markdown document. Warning: This will bring in all of Bootstrap!
#'
#' @param ... \code{htmltools} tag objects, lists, text, HTML widgets, or
#'   NULL. These arguments should be unnamed.
#' @param widths The number of columns that should be assigned to each of the
#'   \code{...} elements (the total number of columns available is always 12).
#'   The width vector will be recycled if there are more \code{...} arguments.
#'   \code{NA} columns will evenly split the remaining columns that are left
#'   after the widths are recycled and non-\code{NA} values are subtracted.
#' @param device The class of device which is targeted by these widths; with
#'   smaller screen sizes the layout will collapse to a one-column,
#'   top-to-bottom display instead. xs: never collapse, sm: collapse below
#'   768px, md: 992px, lg: 1200px.
#'
#' @return A \code{\link[htmltools]{browsable}} HTML element.
#'
#' @examples
#' \donttest{
#' library(htmltools)
#'
#' # If width is unspecified, equal widths will be used
#' bscols(
#'   div(style = css(width="100%", height="400px", background_color="red")),
#'   div(style = css(width="100%", height="400px", background_color="blue"))
#' )
#'
#' # Use NA to absorb remaining width
#' bscols(widths = c(2, NA, NA),
#'   div(style = css(width="100%", height="400px", background_color="red")),
#'   div(style = css(width="100%", height="400px", background_color="blue")),
#'   div(style = css(width="100%", height="400px", background_color="green"))
#' )
#'
#' # Recycling widths
#' bscols(widths = c(2, 4),
#'   div(style = css(width="100%", height="400px", background_color="red")),
#'   div(style = css(width="100%", height="400px", background_color="blue")),
#'   div(style = css(width="100%", height="400px", background_color="red")),
#'   div(style = css(width="100%", height="400px", background_color="blue"))
#' )
#' }
#' @export
bscols <- function(..., widths = NA, device = c("xs", "sm", "md", "lg")) {
  device <- match.arg(device)

  if (length(list(...)) == 0) {
    widths = c()
  } else {
    if (length(widths) > length(list(...))) {
      warning("Too many widths provided to bscols; truncating")
    }
    widths <- rep_len(widths, length(list(...)))

    if (any(is.na(widths))) {
      remaining <- 12 - sum(widths, na.rm = TRUE)
      stretch_cols <- length(which(is.na(widths)))
      stretch_width <- max(1, floor(remaining / stretch_cols))
      widths[is.na(widths)] <- stretch_width
    }

    if (sum(widths) > 12) {
      warning("Sum of bscol width units is greater than 12")
    }
  }

  ui <- tags$div(class = "container-fluid crosstalk-bscols",
    # Counteract knitr pre/code output blocks
    tags$div(class = "row",
      unname(mapply(list(...), widths, FUN = function(el, width) {
        div(class = sprintf("col-%s-%s", device, width),
          el
        )
      }, SIMPLIFY = FALSE))
    )
  )

  browsable(attachDependencies(ui, list(jqueryLib(), bootstrapGrid())))
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


is_available <- function(package, version = NULL) {
  installed <- nzchar(system.file(package = package))
  if (is.null(version)) {
    return(installed)
  }
  installed && isTRUE(fastPackageVersion(package) >= version)
}
