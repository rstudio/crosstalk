If you're the author of an htmlwidget, this tutorial will help you determine whether it is a good candidate for Crosstalk integration, and tell you how to begin.

## Fundamental concepts

A few main concepts form the foundation for interaction in Crosstalk.

- **Shared data** - A single data frame (or data frame-like object) that is shared between all linked visualizations/filter controls.
- **Key** - A string that uniquely identifies a row within a shared data object (similar to a primary key in a SQL table, or the concept of keys in d3). In non-Shiny settings, this is usually just the row number. When using Shiny, it can sometimes be helpful to identify a column in the data frame that can be used as an ID, so that as data frame rows are added, removed, or reordered, each row keeps a consistent key value.
- **Visualizations** - Crosstalk-compatible htmlwidget instances, essentially. Ideally, a visualization supports brushing, highlighting (emphasizing points that have been brushed elsewhere), and showing a subset of rows.
- **Filter controls** - Input widgets/controls that allow users to choose a subset of the data to display; for example, a slider over one of the numerical properties of the data, or a drop-down box with factor levels. Crosstalk itself comes with several filter inputs, and custom filter inputs can be written as well. (If you're familiar with Shiny, these are like Shiny's input widgets, except that they communicate with other client-side Crosstalk components instead of talking to a server.)
- **Group** - A set of visualizations and/or filter controls that are linked together for linked brushing and/or filtering purposes. It's possible for a single web page to have more than one distinct Crosstalk group.

## Introduction to the Crosstalk API

The Crosstalk API has two distinct parts: an R6 class, `SharedData`, that wraps a data frame; and a small JavaScript API through which widgets can send/receive messages to each other relating to brushing and filtering.

Creating a `SharedData` instance is easy. Its R6 constructor has one required and two optional components:

* `data` - The underlying data frame. This can either be an actual data frame (or data frame-like) object, or a Shiny reactive expression that yields such an object.
* `key` - *[Optional]* Either a character vector or one-sided formula that indicates the key of the data frame (see the "Key" definition above). If not provided, then row names (if available) or row numbers will be used as keys.
* `group` - *[Optional]* The name of the Crosstalk group that visualizations/filter controls using this `SharedData` object should belong to. If not provided, a random group name is used, which should be fine in the vast majority of cases.

Users signal their intention to use Crosstalk by passing your widget a `SharedData` instance instead of a regular data frame.

```r
df <- read.csv("mydata.csv", stringsAsFactors=FALSE)
sd <- SharedData$new(df)

# No Crosstalk
myWidget(df)

# Crosstalk enabled
myWidget(sd)
```

As a widget author, you'll want to extract the data frame, key, and group name using the `data`, `key`, and `groupName` methods, respectively.

Assuming you already have a working htmlwidget that works with data frames, the main thing you need to do is unwrap the underlying data frame and add the group name and key values to your widget payload (the `x` parameter in `htmlwidgets::createWidget()`).

Before:

```r
myWidget <- function(data, width = NULL, height = NULL) {
  x <- list(
    data = data
  )
  
  createWidget("myWidget", x, width=width, height=height)
}
```

After:

```r
myWidget <- function(data, width = NULL, height = NULL) {
  if (is.SharedData(data)) {
    # Using Crosstalk
    key <- sharedData$key()
    group <- sharedData$groupName()
    data <- sharedData$data()
  } else {
    # Not using Crosstalk
    key <- NULL
    group <- NULL
  }

  x <- list(
    data = data,
    settings = list(
      crosstalk_key = key,
      crosstalk_group = group
    )
  )

  createWidget("myWidget", x, width=width, height=height)
}
```

Now in your JavaScript binding's `renderValue` method, you can access `x.settings.crosstalk_key` and `x.settings.crosstalk_group`. To tell if Crosstalk is enabled for the current `renderValue` invocation, test one of these values for truthiness.

## Implementing interactions

Now the more difficult part: actually implementing the linked interactions on the JavaScript side.

Currently, Crosstalk supports two types of inter-widget interaction: linked brushing, and filtering. By "supports" I mean that Crosstalk will help visualizations and filter controls *communicate intentions* to each other. But actually implementing the selection, highlighting, and filtering behaviors for each widget type is the job of the widget author.

The sections below will discuss the types of interactions that are expected from each Crosstalk-compatible widget, and how to use Crosstalk's JavaScript APIs to communicate.

// TODO: `htmlDependency` and R import

### Linked brushing

Linked brushing lets the end user select data points in any visualization, to highlight the corresponding data points in all linked visualization.

At any given moment, only one visualization may have a selection; for example, if widget A has an active selection, and then the user begins making a selection on widget B, then widget A should immediately clear its selection.

Ideally, each visualization should be capable of the following:

- Allow the user to <u>make a selection</u>, usually through clicking on data points, or better, making a rectangular or lasso-shaped selection. (The result of the selection must be a subset of the rows in the dataset—that's the only type of selection that is useful in Crosstalk.)
- <u>Clear a selection interactively</u> in response to a user gesture (i.e. clicking on an inert, unselected area of the visualization).
- <u>Clear a selection programmatically</u>, in response to another visualization (in the same Crosstalk group) starting a selection operation.
- <u>Highlight points</u> selected by another visualization. A common way to do this is to lower the opacity of data points that are not selected (and use the maximum opacity value for all data points when no selection is active in the group).

In my experience so far, I've found 4 to be reasonably straightforward to achieve. But 1-3 can be difficult if you're building on top of a JavaScript visualization library that isn't designed to accomodate interactively selecting data points. Though it's far preferable to support all four of these features, it's possible to only support 4 to create what is essentially a "listen-only" Crosstalk participant.

#### Selection JavaScript API

Each Crosstalk-enabled visualization instance (i.e. each call to `renderValue`) should create a new `crosstalk.SelectionHandle` instance. Use `SelectionHandle` to read and write (and listen for changes to) the selection state for a Crosstalk group.

Here's what the htmlwidget binding code for [d3scatter](https://github.com/jcheng5/d3scatter) looks like, without Crosstalk support:

```javascript
HTMLWidgets.widget({

  name: 'd3scatter',

  type: 'output',

  factory: function(el, width, height) {

    var firstRun = true;
    var scatter = d3scatter(el).width(width).height(height);

    return {
      renderValue: function(x) {
        var value = x.data;
        scatter
          .x_var(value.x_var)
          .y_var(value.y_var)
          .color_var(value.color_var)
          .color_spec(value.color_spec)
          .x_label(value.x_label)
          .y_label(value.y_label)
          .x_lim(value.x_lim)
          .y_lim(value.y_lim);

        scatter(!firstRun);
        firstRun = false;
      },
      resize: function(width, height) {
        scatter.width(width).height(height)(false);
      }
    };
  }
});
```

The d3scatter object is created at the scope of the `factory` function. Then, during `renderValue`, it's updated with the `value` object.

The first step is to create a `crosstalk.SelectionHandle` object at the `factory` function level.

```javascript
var sel_handle = new crosstalk.SelectionHandle();
```

We haven't yet specified what group this handle should belong to. In fact, we won't know the group until we receive a value via `renderValue` (and in some circumstances, `renderValue` might be called multiple times with different groups).

But we do have both `scatter` and `sel_handle` objects at this point, so we can wire them together. The d3scatter object has a `"brush"` event that we can use to update the Crosstalk selection handle, and the Crosstalk selection handle has a `"change"` event we can use to highlight the d3scatter data points appropriately.

```javascript
scatter.on("brush", function(keys) {
  sel_handle.set(keys);
});

sel_handle.on("change", function(e) {
  if (e.sender !== sel_handle) {
    scatter.clearBrush();
  }
  scatter.selection(e.value);
});
```

With these relationships established inside of `factory`, we can now move on to `renderValue`. The only modifications we need are to pass the key data to the d3scatter object, and update the group of the `sel_handle` object.

The `SelectionHandle` change event provides a `value` property that indicates the currently selected keys as a string array; or, `value` can be `null` to indicate that no selection is active.

Notice the comparison `e.sender !== sel_handle`; this lets us distinguish between selection operations initiated by this widget instance versus by other instances, and to clear any active selection boundaries in the latter case.

The fully selection-enabled binding code is here:

```javascript
HTMLWidgets.widget({

  name: 'd3scatter',

  type: 'output',

  factory: function(el, width, height) {

    var firstRun = true;
    var scatter = d3scatter(el).width(width).height(height);

    var sel_handle = new crosstalk.SelectionHandle();

    scatter.on("brush", function(keys) {
      sel_handle.set(keys);
    });

    sel_handle.on("change", function(e) {
      if (e.sender !== sel_handle) {
        scatter.clearBrush();
      }
      scatter.selection(e.value);
    });

    return {
      renderValue: function(x) {
        var value = x.data;
        scatter
          .x_var(value.x_var)
          .y_var(value.y_var)
          .color_var(value.color_var)
          .color_spec(value.color_spec)
          .x_label(value.x_label)
          .y_label(value.y_label)
          .x_lim(value.x_lim)
          .y_lim(value.y_lim)
          .key(x.settings.crosstalk_key);

        sel_handle.setGroup(x.settings.crosstalk_group);

        scatter(!firstRun);
        firstRun = false;
      },
      resize: function(width, height) {
        scatter.width(width).height(height)(false);
      }
    };
  }
});
```

### Filtering

Cause a subset of data points to be shown, while all others are hidden.

Unlike with linked brushing, where only a single widget can decide what data points are selected, with filtering multiple widgets can simultaneously contribute to the current "filter set". Crosstalk will determine which data points are permitted by all of the actively filtering widgets,














### Should I integrate my widget with Crosstalk?

Crosstalk makes a few demands on its widgets. If your widget doesn't match all of the following criteria, you may find it difficult to integrate with Crosstalk in a sensible way.

#### Data frame (or data frame-like) format for data

From the R side, your data must be represented in a data frame, or data frame-like object. In particular, it should work with the following S3 generics:
- **`row.names()`** (this can return `NULL`, it just can't error)
- **`nrow()`**
    - **`$<-`** (For example, `df$selected_ <- ...` should add a new column called `selected_` if one doesn't already exist)
    - **`[`** with two dimensions, e.g. `df[row, column]`

This list of criteria may change in the future, so if you have implemented a data structure that you want to work with Crosstalk, the more you can make it look and feel like a data frame, the better.

#### Visualization that can highlight on a row-by-row basis (for linked brushing)

The JavaScript visualization side of your widget must be able to highlight an arbitrary subset of rows.

#### Visualization that can hide/show on a row-by-row basis (for filtering)