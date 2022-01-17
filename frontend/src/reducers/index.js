import { combineReducers } from "redux";
import ohlc from "./ohlc";
import buySell from "./buySell";
import bot from "./bot";

export default combineReducers({
  ohlc,
  buySell,
  bot,
});
