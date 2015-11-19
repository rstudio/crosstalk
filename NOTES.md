# What interface do clients want?


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
