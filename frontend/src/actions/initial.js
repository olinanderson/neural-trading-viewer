import { getDaysList, getOHLC } from "./ohlc";
import { getBuySell } from "./buySell";
import { getBotBuySell, getPredictions } from "./bot";

export const initialRequests = () => (dispatch) => {
  dispatch(getOHLC(new Date().toDateString()));
  dispatch(getBuySell(new Date().toDateString()));
  dispatch(getBotBuySell(new Date().toDateString()));
  dispatch(getPredictions(new Date().toDateString()));
  dispatch(getDaysList());
};
