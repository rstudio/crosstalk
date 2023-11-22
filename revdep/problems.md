# clinDataReview

<details>

* Version: 1.4.0
* GitHub: https://github.com/openanalytics/clinDataReview
* Source code: https://github.com/cran/clinDataReview
* Date/Publication: 2023-02-24 14:30:02 UTC
* Number of recursive dependencies: 131

Run `revdepcheck::cloud_details(, "clinDataReview")` for more info

</details>

## Newly broken

*   checking tests ... ERROR
    ```
      Running ‘testthat.R’
    Running the tests in ‘tests/testthat.R’ failed.
    Complete output:
      > library(testthat)
      > library(clinDataReview)
      > 
      > test_check("clinDataReview")
        adding: report.html (deflated 63%)
        adding: report_dependencies127959c2c4e3/ (stored 0%)
        adding: report_dependencies127959c2c4e3/file127942118d58.html (deflated 8%)
    ...
      ── Error ('test_timeProfileIntervalPlot.R:179:3'): A selection variable is correctly included in the time interval plot ──
      Error: Argument 'txt' must be a JSON string, URL or file.
      Backtrace:
          ▆
       1. └─jsonlite::fromJSON(...) at test_timeProfileIntervalPlot.R:179:3
       2.   └─jsonlite:::stop("Argument 'txt' must be a JSON string, URL or file.")
      
      [ FAIL 4 | WARN 2 | SKIP 29 | PASS 479 ]
      Error: Test failures
      Execution halted
    ```

## In both

*   checking installed package size ... NOTE
    ```
      installed size is  5.9Mb
      sub-directories of 1Mb or more:
        doc   4.3Mb
    ```

