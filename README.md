# Crosstalk

A package for R that enhances [htmlwidgets](http://htmlwidgets.org) with client side, inter-widget interactions (currently linked brushing and filtering).

## Background

While the whole point of HTML Widgets is to allow you to easily create interactive HTML visualizations from R, the kind of interactivity they enable is generally _intra-widget_, meaning interactive things happen within the boundaries of the HTML element they inhabit (hover over a data point to see a tooltip, drag over a range of the time series to zoom in).

The other kind of interactivity is _inter-widget_, meaning that user gestures on one widget can affect other widgets. The most common example is [linked brushing](https://bl.ocks.org/mbostock/4063663), where selecting points on one view of the data highlights those same observations in other views of the data. (Linked brushing is already possible in some libraries like [Plotly](https://plot.ly/r/), but again, only between sub-plots of a single composite Plotly plot, so still intra-widget.)

## What is Crosstalk?

Crosstalk can be thought of as an add-on to the htmlwidgets package. It provides widget authors with a set of classes, functions, and conventions for implementing standard interactions (currently, linked brushing and filtering) in a standard way.

By standardizing on a set of interactions, we can let widget users coordinate widgets with surprisingly little code.

Here's an example using R Markdown:

```
---
title: Fiji earthquakes
output: html_document
---

&#96;``{r}
library(htmltools)
library(crosstalk)
library(leaflet)
library(DT)

# Wrap data frame in SharedData
sd <- SharedData$new(quakes)

# Create a filter input
filter_slider("mag", "Magnitude", sd, column = "mag", step = 0.1)

# Use SharedData like a dataframe with Crosstalk-enabled widgets
leaflet(sd) %>% addTiles() %>% addMarkers()
datatable(sd)
&#96;``
```

We wrap the data frame `quakes` in a `SharedData` R6 object to signal to widgets and filter inputs that they should link up to other Crosstalk-enabled widgets/inputs that use the same `SharedData` object.

Here are the results:

![crosstalk.gif](crosstalk.gif)

## Important limitations

There are inherent limitations in the current version of Crosstalk that widget authors and users need to be aware of.

1. **Crosstalk currently only works for linked brushing and filtering of views that show individual data points, not aggregate or summary views** (where "observations" is defined as a single row in a data frame). For example, histograms are not supported since each bar represents multiple data points; but scatter plot points each represent a single data point, so they are supported.
2. Because all data must be loaded into the browser, **Crosstalk is not appropriate for large data sets**. (There's no hard limit, since HTML widgets require varying amounts of CPU cycles and memory for each data point.)

## What widgets work with Crosstalk?

Crosstalk is still **experimental** (i.e. APIs may change) and is not yet available on CRAN. Therefore, work on widgets is taking place on GitHub branches until Crosstalk is stable.

### Plotly

[Plotly](https://plot.ly/r/) supports linked brushing and filtering for scatterplots for `plot_ly` plots. `ggplotly` is not supported.

*Note*: To make a selection on a Plotly plot, make sure to switch to the "Box Select" or "Lasso Select" tool, as the default is to zoom. You can change the default by adding `%>% layout(dragmode = "select")` (or `"lasso"`) to your plotly object, as in the example below.

#### Installation

```r
devtools::install_github("ropensci/plotly@joe/feature/crosstalk")
```

#### Example

```r
library(crosstalk)
library(plotly)

set.seed(100)
sd <- SharedData$new(diamonds[sample(nrow(diamonds), 1000), ])

plot_ly(d, x = carat, y = price, text = paste("Clarity: ", clarity),
  mode = "markers", color = carat, size = carat) %>%
  layout(dragmode = "select")
```

### Leaflet

[Leaflet](https://rstudio.github.io/leaflet/) supports linked brushing and filtering for markers, circle markers, and shapes. You can't currently make a selection on a Leaflet map, but selections on other widgets will be reflected with increased/decreased opacity on the map.

#### Installation

```r
devtools::install_github("rstudio/leaflet@joe/feature/crosstalk-filter")
```

#### Example

```r
library(crosstalk)
library(leaflet)

sd <- SharedData$new(quakes)

leaflet(sd) %>% addMarkers()
```

### DT

[DT](https://rstudio.github.io/DT/) supports filtering.

#### Installation

```r
devtools::install_github("rstudio/DT@joe/feature/crosstalk")
```

#### Example

```r
library(crosstalk)
library(DT)

sd <- SharedData$new(mtcars)

datatable(sd)
```

## What filters are available?

Currently, the following filter controls are available. These are built-in to the Crosstalk package.

* `filter_slider` - A range slider that filters on a single (numeric, date, or date/time) variable.
* `filter_checkbox` - List of checkboxes to filter based on a categorical variable.
* `filter_select` - [Selectize](http://selectize.github.io/selectize.js/)-based control to filter based on a categorical variable.

These widgets work almost anywhere HTML widgets themselves do: R Markdown documents, Shiny apps, from the R console.

See the function reference in the Crosstalk package for more details.

## How do I modify my own HTML widget to support Crosstalk?

TODO

## How can I write my own filter input widget?

TODO

## Can I use Crosstalk with Shiny?

Yes! TODO
