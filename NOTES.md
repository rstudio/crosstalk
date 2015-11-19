# Crosstalk

A testing ground for ideas about cross-widget communication that should eventually make their way into htmlwidgets and Shiny (probably).

Abstract goals:

- Allow easy, or even automatic, orchestration between htmlwidgets on the same page, without Shiny. No JavaScript should need to be written by user.
- Allow easy orchestration between htmlwidgets and Shiny reactivity.
- Widget authors will need custom code in their widget JS to work with crosstalk--this won't just magically work with existing widgets.
- Crosstalk will provide a communication layer, but in order for the messages to be useful, the widgets all have to agree on what they mean.
- We'll promote an "official" vocabulary of messages, complete with guidelines for widget authors, and also allow arbitrary messages. Over time, the official list can grow.

Concrete goals:

- Linked brushing demos (this is basically just a "selected points" message).
- Ad-hoc messaging demo (i.e. Ramnath decides three of his widgets should communicate in a certain way).


## High-level discrete selection API
Selection is scoped to a group.
"Discrete" as opposed to a range-selection.

### Manipulation
- A data point was clicked, toggle its selection
- A set of data points was selected, use it to set (P0) or add/remove to (P2) or xor (P3) selection
- Clear the selection

### Linking
- Tell me when the selection changes
  - Tell me who made the changes


## Low-level shared value API
Shared values are scoped to a group, and have an identifier.

Static
- Get a handle to a shared value object

Instance
- Get the current value
- Set the value
- Receive notification when the value changes


## Low-level message queue API


## Target-Action binding API
- A widget can advertise what unique events it emits.
- A widget can advertise what "actions" (methods) on it can be called.
- You can specify that certain events can be routed to certain actions.

Example:

A slider widget emits an event when its value changes.
A temporal-spatial choropleth widget has a `setYear(year)` action.
`bind(source = "slider.onValueChanged", target = "choropleth.setYear")`
will basically result in
`slider.onValueChanged(choropleth.setYear)`
more or less.

Does this actually solve any nontrivial problems?
Can we be sure that at the time that this bind() call runs, both slider and choropleth exist and we have references to them?
