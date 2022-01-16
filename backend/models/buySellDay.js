var mongoose = require("mongoose");

var buySellDays = new mongoose.Schema({
  ticker: String,
  day: String,
  buySellDaysArray: [
    {
      date: Number,
      buy: Number,
      sell: Number,
      _id: false,
    },
  ],
});

module.exports = mongoose.model("buySellDays", buySellDays);
