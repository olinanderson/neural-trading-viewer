const express = require("express"),
  router = express.Router(),
  fs = require("fs"),
  path = require("path"),
  ohlcDay = require("../../models/ohlcDay");

// @route GET api/ohlc/
// @desc Send chart data to front end
// @access Public
router.get("/", async (req, res) => {
  try {

    var query = await ohlcDay.findOne({
      ticker: "MSFT",
      day: req.query.day,
    });

    res.json(query);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route GET api/ohlc/daysList
// @desc Send chart data to front end
// @access Public
router.get("/daysList", async (req, res) => {
  try {

    var uniquePayload = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../assets/json/allOhlc.json")));

    // Returning the array
    res.json(uniquePayload);

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
