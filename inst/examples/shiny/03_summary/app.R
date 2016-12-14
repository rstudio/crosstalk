library(shiny)
library(crosstalk)
library(d3scatter)
library(dplyr)

ui <- fluidPage(
  selectInput("species", "Species", levels(iris$Species), multiple = TRUE),
  fluidRow(
    column(6, d3scatterOutput("scatter1")),
    column(6, d3scatterOutput("scatter2"))
  ),
  h4("Summary of selected data"),
  verbatimTextOutput("summary")
)

server <- function(input, output, session) {
  # Subset the dataset based on user's choice of species
  user_iris <- reactive({
    iris[is.null(input$species) | iris$Species %in% input$species,]
  })

  shared_iris <- SharedData$new(user_iris)

  output$scatter1 <- renderD3scatter({
    d3scatter(shared_iris, ~Petal.Length, ~Petal.Width, ~Species, width = "100%")
  })

  output$scatter2 <- renderD3scatter({
    d3scatter(shared_iris, ~Sepal.Length, ~Sepal.Width, ~Species, width = "100%")
  })

  output$summary <- renderPrint({
    df <- shared_iris$data(withSelection = TRUE) %>%
      filter(selected_ | is.na(selected_)) %>%
      mutate(selected_ = NULL)

    cat(nrow(df), "observation(s) selected\n\n")
    summary(df)
  })
}

shinyApp(ui, server)

