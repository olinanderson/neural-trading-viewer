const express = require("express"),
    router = express.Router(),
    buySellDay = require("../../models/buySellDay");

// @route GET api/charts
// @desc Send chart data to front end
// @access Public
router.get("/", async (req, res) => {
    try {
        var query = await buySellDay.findOne({
            ticker: "MSFT",
            day: req.query.day,
        });

        res.json(query);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
