if (!d3.selection.prototype.cond) {
  d3.selection.prototype.cond = function(condition, method) {
    if (!condition) {
      return this;
    }
    var args = [];
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    return this[method].apply(this, args);
  };
}

function d3scatter(container) {
  container = d3.select(container);
  var dispatch = d3.dispatch("brush");
  var props = {};
  var margin = {top: 20, right: 20, bottom: 30, left: 40};

  var x = d3.scale.linear();

  var y = d3.scale.linear();

  var brush = d3.svg.brush()
      .x(x)
      .y(y);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var outerSvg = container.append("svg")
      .attr("class", "d3scatter");
  var svg = outerSvg.append("g");
  var xAxisNode = svg.append("g")
      .attr("class", "x axis");
  var yAxisNode = svg.append("g")
      .attr("class", "y axis");
  var xAxisLabel = xAxisNode.append("text")
      .attr("class", "label")
      .attr("y", -6)
      .style("text-anchor", "end");
  var yAxisLabel = yAxisNode.append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");

  function draw(animate) {

    var color_spec = props.color_spec;
    var color;
    if (color_spec.type === "constant") {
      color = function() { return color_spec.value; };
    } else if (color_spec.type === "ordinal") {
      color = d3.scale.category10()
        .domain(typeof(color_spec.values) === "string"
            ? [color_spec.values, color_spec.values]
            : color_spec.values);
    } else if (color_spec.type === "linear") {
      color = d3.scale.linear()
        .domain(color_spec.range)
        .range(["red", "blue"]);
    }

    var data = {x: props.x_var, y: props.y_var};
    if (props.color_var) {
      data.color = props.color_var;
    }
    if (props.key) {
      data.key = props.key;
    }
    data = HTMLWidgets.dataframeToD3(data);
    var width = props.width - margin.left - margin.right;
    var height = props.height - margin.top - margin.bottom;
    outerSvg
        .cond(animate, "transition")
        .attr("width", props.width)
        .attr("height", props.height);
    svg
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.range([0, width]);
    if (props.x_lim)
      x.domain(props.x_lim);
    else
      x.domain(d3.extent(data, function(d) { return d.x; })).nice();

    y.range([height, 0]);
    if (props.y_lim)
      y.domain(props.y_lim);
    else
      y.domain(d3.extent(data, function(d) { return d.y; })).nice();

    xAxisNode
        .cond(animate, "transition")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    xAxisLabel
        .cond(animate, "transition")
        .attr("x", width)
        .text(props.x_label);

    yAxisNode
        .cond(animate, "transition")
        .call(yAxis);
    yAxisLabel
        .text(props.y_label);

    svg.classed("selection-active", function() {
      return props.selectionSet && !props.selectionSet.empty();
    });

    var filteredData = data;
    if (props.filterFunc) {
      filteredData = data.filter(props.filterFunc);
    }

    var dots = svg.selectAll(".dot")
        .data(filteredData, props.key ? function(d, i) {
          return d.key;
        } : void 0);

    dots
      .enter().append("circle")
        .attr("cx", function(d) { return x(d.x); })
        .attr("cy", function(d) { return y(d.y); })
        .attr("class", "dot")
        .attr("r", 3.5);
    dots
      .exit()
        .remove();
    dots
        .cond(props.selectionSet && !props.selectionSet.empty(), "classed", "selected", function(d) {
          return props.selectionSet.has(d.key);
        })
        .cond(animate, "transition")
        .attr("cx", function(d) { return x(d.x); })
        .attr("cy", function(d) { return y(d.y); })
        .style("fill", function(d) {
          return color(d.color);
        });

    if (props.color_spec && color.domain) {
      var legend = svg.selectAll(".legend")
          .data(color.domain());
      var legendNew = legend.enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      legendNew.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18);

      legendNew.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end");

      legend.exit().remove();

      legend.selectAll("rect")
          .cond(animate, "transition")
          .attr("x", width - 18)
          .style("fill", color);
      legend.selectAll("text")
          .cond(animate, "transition")
          .attr("x", width - 24)
          .text(function(d) { return d; });
    }

    svg.call(brush);
  }

  function property(name) {
    draw[name] = function(value) {
      if (!arguments.length) return props[name];
      props[name] = value;
      return draw;
    };
  }

  property("width");
  property("height");
  property("x_var");
  property("x_label");
  property("x_lim");
  property("y_var");
  property("y_label");
  property("y_lim");
  property("color_var");
  property("color_spec");
  property("key");

  draw.on = function(eventType, listener) {
    dispatch.on(eventType, listener);
  };

  brush.on("brush", function() {
    var ext = brush.extent();
    var data = HTMLWidgets.dataframeToD3({x: props.x_var, y: props.y_var, key: props.key});
    var selectedKeys = data
      .filter(function(obs) {
        return obs.x >= ext[0][0] && obs.x <= ext[1][0] &&
          obs.y >= ext[0][1] && obs.y <= ext[1][1];
      })
      .map(function(obs) {
        return obs.key;
      });
    dispatch.brush.call(draw, selectedKeys);
  });

  draw.selection = function(value) {
    if (!arguments.length) return props.selection;

    props.selection = value;
    props.selectionSet = value ? d3.set(value) : null;
    draw(false);
  };

  draw.filter = function(value) {
    if (!arguments.length) return props.filter;

    props.filter = value;

    if (!props.filter) {
      props.filterFunc = function(d, i) { return true; }
    } else {
      var filterSet = d3.set(value);
      props.filterFunc = function(d, i) {
        return filterSet.has(d.key);
      }
    }

    draw(false);
  };

  draw.clearBrush = function() {
    brush.clear();
  };

  return draw;
}
