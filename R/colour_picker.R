#' Create a colour palette widget
#'
#' Create an input control to select a colour, \emph{with or without shiny}
#'
#' A colour input allows users to select a colour by clicking on the desired
#' colour, or by entering a valid HEX colour in the input box. The input can
#' be initialized with either a colour name or a HEX value. The return value is
#' a HEX value by default, but you can use the \code{returnName = TRUE} parameter
#' to get an R colour name instead (only when an R colour exists for the
#' selected colour).
#'
#' Since most functions in R that accept colours can also accept the value
#' "transparent", \code{colourInput} has an option to allow selecting the
#' "transparent" colour. When the user checks the checkbox for this special
#' colour, the returned value form the input is "transparent".
#'
#' @param id An HTML element ID; must be unique within the web page
#' @param label Display label for the control, or `\code{NULL} for no label.
#' @param sharedData \code{SharedData} object with the data to filter
#' @param value Initial value (can be a colour name or HEX code)
#' @param showColour Whether to show the chosen colour as text inside the input,
#' as the background colour of the input, or both (default).
#' @param palette The type of colour palette to allow the user to select colours
#' from. \code{square} (default) shows a square colour palette that allows the
#' user to choose any colour, while \code{limited} only gives the user a
#' predefined list of colours to choose from.
#' @param allowedCols A list of colours that the user can choose from. Only
#' applicable when \code{palette == "limited"}. The \code{limited} palette
#' uses a default list of 40 colours if \code{allowedCols} is not defined.
#' @param allowTransparent If \code{TRUE}, then add a checkbox that allows the
#' user to select the \code{transparent} colour.
#' @param transparentText The text to show beside the transparency checkbox
#' when \code{allowTransparent} is \code{TRUE}. The default value is
#' "Transparent", but you can change it to "None" or any other string. This has
#' no effect on the return value from the input; when the checkbox is checked,
#' the input will always return the string "transparent".
#'
#' @note This function is an adaption of the fabulous \code{\link[shinyjs]{colourInput}}
#' so that crosstalk can take advantage of colour palette changes, without shiny.
#'
#' @export
#' @examples
#' # TODO: fix sizing!
#' colour_picker(
#'   label = "Make America Great Again!",
#'   palette = "limited",
#'   allowedCols = c("red", "white", "blue")
#' )
colour_picker <- function(id = new_id(), label, sharedData, value = "white",
                          showColour = c("both", "text", "background"),
                          palette = c("square", "limited"),
                          allowedCols = NULL, allowTransparent = FALSE,
                          transparentText = "transparent") {
  # sanitize arguments
  x <- list(
    showColour = match.arg(showColour),
    palette = match.arg(palette),
    allowedCols = paste(formatHEX(allowedCols), collapse = " "),
    allowTransparent = allowTransparent,
    transparentText = transparentText
  )
  input_id <- paste0(id, "-input")
  options <- list(
    settings = x,
    value = formatHEX(value),
    group = sharedData$groupName()
  )

  htmltools::browsable(attachDependencies(
    tags$div(
      id = id,
      class = "form-group crosstalk-input-colour-picker crosstalk-input",
      if (nchar(label)) tags$p(label),
      tags$input(
        id = input_id,
        class = "form-control my-cp"
      ),
      # TODO: move this bit to input_colour_picker.js?
      #tags$script(
      #  type = "text/javascript",
      #  sprintf(
      #    "var $el = $('#%s'); $el.colourpicker(%s); $el.colourpicker('value', '%s')",
      #    input_id, jsonlite::toJSON(x, auto_unbox = T), x[["value"]]
      #  )
      #),
      tags$script(
        type = "application/json",
        `data-for` = id,
        jsonlite::toJSON(options, dataframe = "columns", pretty = TRUE)
      )
    ),
    c(list(jqueryLib(), colourPickerLib()), crosstalkLibs())
  ))
}

new_id <- function() {
  basename(tempfile(""))
}

colourPickerLib <- function() {
  htmlDependency(
    "colourpicker", "2.1.12",
    system.file("www/lib/colourpicker", package = "crosstalk"),
    stylesheet = "colourpicker.min.css",
    script = "colourpicker.min.js"
  )
}

# from shinyjs:::formatHEX(), thanks Dean
formatHEX <- function(x) {
  unlist(lapply(x, formatHEXsingle))
}

formatHEXsingle <- function(x) {
  if (is.null(x) || x == "")
    return(NULL)
  if (x == "transparent") {
    return(x)
  }
  if (x %in% grDevices::colors()) {
    x <- do.call(grDevices::rgb, as.list(grDevices::col2rgb(x)/255))
  }
  if (!grepl("^#?([[:xdigit:]]{3}|[[:xdigit:]]{6})$", x)) {
    stop(sprintf("%s is not a valid colour", x), call. = FALSE)
  }
  if (substr(x, 1, 1) != "#") {
    x <- paste0("#", x)
  }
  if (nchar(x) == 4) {
    x <- paste0("#", substr(x, 2, 2), substr(x, 2, 2), substr(x, 3, 3),
                substr(x, 3, 3), substr(x, 4, 4), substr(x, 4, 4))
  }
  toupper(x)
}
