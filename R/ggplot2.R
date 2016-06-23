#' ggplot2 helpers
#'
#' Add \code{scale_fill_selection()} or \code{scale_color_selection} to a ggplot
#' to customize the scale for fill or color, respectively, for linked brushing.
#' Use \code{selection_factor} to turn logical vectors representing selection,
#' to a factor with the levels ordered for use with ggplot2 bar stacking.
#'
#' @param color_false The color that should be mapped to unselected rows
#' @param color_true The color that should be mapped to selected rows
#'
#' @examples
#' \dontrun{
#' sd <- SharedData$new(iris)
#' renderPlot({
#'   df <- sd$data(withSelection = TRUE, withFilter = TRUE)
#'   ggplot(df, aes(Sepal.Length, Sepal.Width,
#'     color = selection_factor(df))) +
#'     geom_point() +
#'     scale_color_selection("#444444", "skyblue1")
#' })
#'
#' }
#' @export
scale_fill_selection <- function(color_false, color_true) {
  list(
    ggplot2::scale_fill_manual(values = c("TRUE" = color_true, "FALSE" = color_false)),
    ggplot2::guides(fill = FALSE)
  )
}

#' @rdname scale_fill_selection
#' @export
scale_color_selection <- function(color_false, color_true) {
  list(
    ggplot2::scale_color_manual(values = c("TRUE" = color_true, "FALSE" = color_false)),
    ggplot2::guides(colour = FALSE)
  )
}

#' @param x Either a data frame with a \code{selected_} column, or, a logical
#'   vector indicating which rows are selected
#' @param na.replace The value to use to replace \code{NA} values; choose either
#'   \code{FALSE}, \code{NA}, or \code{TRUE} based on how you want values to be
#'   treated when no selection is active
#' @rdname scale_fill_selection
#' @export
selection_factor <- function(x, na.replace = c(FALSE, NA, TRUE)) {
  if (missing(na.replace))
    na.replace <- FALSE

  selection <- if (is.logical(x)) {
    x
  } else {
    x$selected_
  }
  selection[is.na(selection)] <- na.replace
  factor(selection, ordered = TRUE, levels = c(TRUE, FALSE))
}

#' Synchronize Shiny brush selection with shared data
#'
#' Waits for a brush to change, and propagates that change to the
#' \code{sharedData} object.
#'
#' @param sharedData The shared data instance
#' @param brushId Character vector indicating the name of the \code{plotOutput}
#'   brush
#' @param ownerId (TBD)
#'
#' @export
maintain_selection <- function(sharedData, brushId, ownerId = "") {
  force(sharedData)
  force(brushId)
  session <- shiny::getDefaultReactiveDomain()

  observeEvent(session$input[[brushId]], {
    df <- sharedData$data(withKey = TRUE, withFilter = TRUE)
    df <- shiny::brushedPoints(df, session$input[[brushId]])
    sharedData$selection(df$key_, ownerId)
  }, ignoreNULL = FALSE)
}
