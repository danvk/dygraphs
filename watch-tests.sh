watchify \
  -v -t babelify \
  --debug \
  -o dist/tests.js \
  auto_tests/tests/sanity.js \
  auto_tests/tests/pathological_cases.js \
  auto_tests/tests/axis_labels.js \
  auto_tests/tests/annotations.js \
  auto_tests/tests/callback.js \
  auto_tests/tests/connect_separated_points.js \
  auto_tests/tests/fill_step_plot.js \
  auto_tests/tests/custom_bars.js \
  auto_tests/tests/css.js \
  auto_tests/tests/data_api.js \
  auto_tests/tests/date_formats.js \
  auto_tests/tests/date_ticker.js \
  auto_tests/tests/error_bars.js \
  auto_tests/tests/dygraph-options-tests.js \
  auto_tests/tests/fast_canvas_proxy.js \
  auto_tests/tests/formats.js \
  auto_tests/tests/hidpi.js \
  auto_tests/tests/interaction_model.js \
  auto_tests/tests/missing_points.js \
  auto_tests/tests/multi_csv.js \


cat <<END
auto_tests/tests/multiple_axes.js \
auto_tests/tests/no_hours.js \
auto_tests/tests/numeric_ticker.js \
auto_tests/tests/parser.js \
auto_tests/tests/per_axis.js \
auto_tests/tests/per_series.js \
auto_tests/tests/plugins.js \
auto_tests/tests/plugins_legend.js \
auto_tests/tests/range_selector.js \
auto_tests/tests/range_tests.js \
auto_tests/tests/resize.js \
auto_tests/tests/rolling_average.js \
auto_tests/tests/scientific_notation.js \
auto_tests/tests/scrolling_div.js \
auto_tests/tests/selection.js \
auto_tests/tests/simple_drawing.js \
auto_tests/tests/smooth_plotter.js \
auto_tests/tests/stacked.js \
auto_tests/tests/step_plot_per_series.js \
auto_tests/tests/synchronize.js \
auto_tests/tests/to_dom_coords.js \
auto_tests/tests/two_digit_years.js \
auto_tests/tests/update_options.js \
auto_tests/tests/update_while_panning.js \
auto_tests/tests/utils_test.js \
auto_tests/tests/axis_labels-deprecated.js \
auto_tests/tests/visibility.js
auto_tests/tests/gviz.js \
END > /dev/null


# These ones are going to be hard
cat <<END
# There are differences between how installPattern and setLineDash work:
auto_tests/tests/grid_per_axis.js
END > /dev/null
