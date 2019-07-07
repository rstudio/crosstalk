## crosstalk 1.0.1.9000

* Add `selected` parameter to `filter_select`, to specify default selection.

## crosstalk 1.0.1

* `selection_factor` behavior was no longer correct with ggplot2 2.2.0, which
  changed its algorithm for stacking order. Added a `reverse` argument that
  defaults to detecting ggplot2 version and acting accordingly.

## crosstalk 1.0.0

Initial release.
