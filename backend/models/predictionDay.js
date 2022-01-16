var mongoose = require("mongoose");

var predictionDays = new mongoose.Schema({
  ticker: String,
  day: String,
  trailingStopPercent: Number, // This is (0 - 100)
  decisionBoundary: Number, // This is (0 - 1)
  predictionDaysArray: [
    {
      date: Number,
      prediction: Number,
      bidSize: Number,
      askSize: Number,
      bidPrice: Number,
      askPrice: Number,
      _id: false,
    },
  ],
});

module.exports = mongoose.model("predictionDays", predictionDays);
