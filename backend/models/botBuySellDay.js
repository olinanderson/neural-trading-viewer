var mongoose = require("mongoose");

var botBuySellDays = new mongoose.Schema({
  ticker: String,
  day: String,
  trailingStopPercent: Number,
  longDecisionBoundary: Number,
  shortDecisionBoundary: Number,
  resetDecisionBoundary: Number,
  botBuySellDaysArray: [
    {
      date: Number,
      longOrShort: String,
      typeOfDecision: String,
      _id: false,
    },
  ],
});

module.exports = mongoose.model("botBuySellDays", botBuySellDays);
