library(leaflet)
library(bubbles)
library(htmltools)
library(ggplot2)
library(dplyr)

sharedData <- crosstalk::SharedData$new(df, "id", group = "one")

l <- leaflet(df) %>% addMarkers(label = ~id, layerId = ~id, group = "one")
b <- bubbles(df$mag, df$id, key = df$id, group = "one")

browsable(tags$div(
  b, l
))
