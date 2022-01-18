const express = require("express"),
  router = express.Router(),
  ohlcDay = require("../../models/ohlcDay");

// @route GET api/charts
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

router.get("/daysList", async (req, res) => {
  try {


    var query = await ohlcDay.find({ ticker: "MSFT" });


    let payload = [];

    for (let i = 0; i < query.length; i++) {
      payload.push(query[i].day);
    }

    // Getting rid of duplicates 
    let uniquePayload = [...new Set(payload)];

    // Converting to ms to organize into ascending order 
    uniquePayload = uniquePayload.map((element) => {
      return Date.parse(element);
    });

    // Sorting in ascending order 
    uniquePayload = uniquePayload.sort((a, b) => {
      return a - b;
    });

    // Converting back to date string
    uniquePayload = uniquePayload.map((element) => {
      return new Date(element).toDateString();
    });

    // Returning the array
    res.json(uniquePayload);

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
