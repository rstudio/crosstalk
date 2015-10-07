library(leaflet)
library(bubbles)
library(htmltools)
library(ggplot2)
library(dplyr)

df <- head(quakes, 30)
df <- cbind(df, id = row.names(df))

# browsable(tags$div(
#   b, l
# ))

library(shiny)

ui <- fluidPage(
  fluidRow(
    column(6, leafletOutput("map")),
    column(6, bubblesOutput("bubbles"))
  ),
  fluidRow(
    column(6, plotOutput("plot")),
    column(6, actionButton("clearSelection", "Clear Selection"))
  )
)

server <- function(input, output, session) {
  sharedData <- crosstalk::SharedData$new(df, "id", group = "one")

  output$map <- renderLeaflet({
    leaflet(sharedData$data()) %>% addMarkers(label = ~id, layerId = ~id, group = "one")
  })

  output$bubbles <- renderBubbles({
    df <- sharedData$data()
    bubbles(df$mag, df$id, key = df$id, group = "one")
  })

  output$plot <- renderPlot({
    df_sel <- sharedData$data(withSelection = TRUE)

    if (all(is.na(df_sel$`_selected`))) {
      ggplot(df_sel, aes(x = mag)) + geom_histogram(binwidth = 0.6)
    } else {
      ggplot(df_sel, aes(x = mag)) + geom_histogram(aes(fill = `_selected`), binwidth = 0.6)
    }
  })

  observeEvent(input$clearSelection, {
    sharedData$clearSelection()
  })

  observe({
    invalidateLater(2000, session)
    sharedData$selection(sample(df$id, 10))
  })
}

shinyApp(ui, server)
