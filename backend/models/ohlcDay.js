var mongoose = require("mongoose");

var ohlcDay = new mongoose.Schema({
  ticker: String,
  day: String,
  ohlcArray: [
    {
      open: Number,
      high: Number,
      low: Number,
      close: Number,
      volume: Number,
      date: Number,
      _id: false,
    },
  ],
});

module.exports = mongoose.model("ohlcDay", ohlcDay);
