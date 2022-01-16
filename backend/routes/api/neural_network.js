const express = require("express"),
  router = express.Router(),
  predictionDay = require("../../models/predictionDay"),
  botBuySellDay = require("../../models/botBuySellDay");

// @route GET api/charts
// @desc Send chart data to front end
// @access Public
router.get("/bot_buy_sell/initial", async (req, res) => {
  try {
    var query = await botBuySellDay.findOne({
      ticker: "MSFT",
      day: new Date().toDateString(),
    });

    res.json(query);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.get("/predictions/initial", async (req, res) => {
  try {
    var query = await predictionDay.findOne({
      ticker: "MSFT",
      day: new Date().toDateString(),
    });

    res.json(query);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
