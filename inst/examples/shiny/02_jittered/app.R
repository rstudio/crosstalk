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
  jittered_iris <- reactive({
    invalidateLater(500)
    data.frame(lapply(iris, function(col) {
      if (is.numeric(col))
        jitter(col)
      else
        col
    }))
  })
  shared_iris <- SharedData$new(jittered_iris)

  output$scatter1 <- renderD3scatter({
    d3scatter(shared_iris, ~Petal.Length, ~Petal.Width, ~Species, width = "100%",
      x_lim = range(iris$Petal.Length), y_lim = range(iris$Petal.Width))
  })

  output$scatter2 <- renderD3scatter({
    d3scatter(shared_iris, ~Sepal.Length, ~Sepal.Width, ~Species, width = "100%",
      x_lim = range(iris$Sepal.Length), y_lim = range(iris$Sepal.Width))
  })
}

shinyApp(ui, server)

