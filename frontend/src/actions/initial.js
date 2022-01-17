import { getOHLC } from "./ohlc";
import { getBotBuySell, getPredictions } from "./bot";

export const initialRequests = () => (dispatch) => {
  dispatch(getOHLC());
  dispatch(getBotBuySell());
  dispatch(getPredictions());
};


