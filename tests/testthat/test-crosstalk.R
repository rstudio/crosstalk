set.seed(64327883)

run_main_test <- function() {
  expect_identical(
    SharedData$new(mtcars)$key(),
    row.names(mtcars)
  )
  expect_identical(
    SharedData$new(mtcars, NULL)$key(),
    row.names(mtcars)
  )

  expect_identical(SharedData$new(mtcars)$data(), mtcars)
  expect_identical(SharedData$new(mtcars)$origData(), mtcars)

  expect_identical(
    SharedData$new(mtcars)$data(TRUE, FALSE, TRUE),
    cbind(mtcars, selected_ = NA, key_ = row.names(mtcars),
      stringsAsFactors = FALSE)
  )

  mtcarsWithNames <- mtcars
  row.names(mtcarsWithNames) <- NULL
  mtcarsWithNames <- cbind(id = row.names(mtcars), mtcarsWithNames,
    stringsAsFactors = FALSE)

  expect_identical(
    SharedData$new(mtcarsWithNames, mtcarsWithNames[["id"]])$key(),
    row.names(mtcars)
  )

  expect_identical(
    SharedData$new(iris, group = "Iris")$groupName(),
    "Iris"
  )
}

test_that("SharedData basic scenarios", {
  skip_if_not_installed("shiny")
  run_main_test()

  expect_error(SharedData$new(iris)$selection(), "reactive")
  shiny::isolate(expect_identical(SharedData$new(iris)$selection(), NULL))
})

test_that("SharedData basic scenarios with shiny 'uninstalled'", {
  skip_if_not_installed("shiny")

  # Force shinyIsInstalled() to return false
  op <- options(crosstalk.shiny.suppressed = TRUE)
  on.exit(options(op), add = TRUE)

  # After this test is over, unload shiny to undo our breakage (below)
  on.exit(unloadNamespace("shiny"), add = TRUE)

  # Break Shiny, so if Shiny functions are called they won't succeed, as
  # if Shiny is not installed.
  pkgEnv <- asNamespace("shiny")
  for (nm in ls(pkgEnv)) {
    unlockBinding(nm, pkgEnv)
    pkgEnv[[nm]] <- NULL
  }

  run_main_test()
  expect_error(SharedData$new(iris)$selection(), "requires.*shiny")

  # While we're at it, run examples
  library(crosstalk)
  helpPath <- file.path(system.file("help", package = "crosstalk"), "crosstalk")
  if (file.exists(paste0(helpPath, ".rdx"))) {
    topics <- names(tools:::fetchRdDB(helpPath))
    for (topic in topics) {
      suppressWarnings({
        eval(bquote(example(.(topic), package = "crosstalk")))
      })
    }
  }
})

test_that("Shiny modules support SharedData", {
  sess <- shiny::MockShinySession$new()
  sd1 <- shiny::withReactiveDomain(sess, {
    SharedData$new(cars, group = "foo")
  })
  sd2 <- shiny::withReactiveDomain(sess$makeScope("module1"), {
    SharedData$new(cars, group = "foo")
  })

  sess$setInputs(".clientValue-foo-selection" = c("1", "2"))

  res <- c(TRUE, TRUE, rep_len(FALSE, nrow(cars) - 2))
  expect_identical(shiny::isolate(sd1$selection()), res)
  expect_identical(shiny::isolate(sd2$selection()), res)

  res2 <- rev(res)
  sess$setInputs(".clientValue-foo-selection" = as.character(which(res2)))

  expect_identical(shiny::isolate(sd1$selection()), res2)
  expect_identical(shiny::isolate(sd2$selection()), res2)

})
