library(shiny)
library(crosstalk)
library(d3scatter)

ui <- fluidPage(
  fluidRow(
    column(6, d3scatterOutput("scatter1")),
    column(6, d3scatterOutput("scatter2"))
  )
)

server <- function(input, output, session) {
  shared_iris <- SharedData$new(iris)

  output$scatter1 <- renderD3scatter({
    d3scatter(shared_iris, ~Petal.Length, ~Petal.Width, ~Species, width = "100%")
  })

  output$scatter2 <- renderD3scatter({
    d3scatter(shared_iris, ~Sepal.Length, ~Sepal.Width, ~Species, width = "100%")
  })
}

shinyApp(ui, server)

