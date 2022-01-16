import { getOHLC } from "./realtime";
import { getBotBuySell, getPredictions } from "./neural_network";

export const initialRequests = () => (dispatch) => {
  dispatch(getOHLC());
  dispatch(getBotBuySell());
  dispatch(getPredictions());
};
