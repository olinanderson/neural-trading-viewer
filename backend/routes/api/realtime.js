const express = require("express"),
  router = express.Router(),
  ohlcDay = require("../../models/ohlcDay");

// @route GET api/charts
// @desc Send chart data to front end
// @access Public
router.get("/ohlc/initial", async (req, res) => {
  try {
    var query = await ohlcDay.findOne({
      ticker: "MSFT",
      day: new Date().toDateString(),
    });

    res.json(query);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
