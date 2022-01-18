import { getDaysList, getOHLC } from "./ohlc";
import { getBuySell } from "./buySell";
import { getBotBuySell, getPredictions } from "./bot";

export const getDailyData = (date, getList) => (dispatch) => {
  if (getList) {
    dispatch(getDaysList());
  }
  dispatch(getOHLC(date));
  dispatch(getBuySell(date));
  dispatch(getBotBuySell(date));
  dispatch(getPredictions(date));
};
