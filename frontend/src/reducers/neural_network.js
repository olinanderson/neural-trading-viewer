import {
  GET_PREDICTIONS,
  GET_PREDICTIONS_FAIL,
  GET_BOT_BUY_SELL,
  GET_BOT_BUY_SELL_FAIL,
} from "../actions/types";

const initialState = {
  predictionDay: {},
  predictionDayLoading: true,
  botBuySellDay: {},
  botBuySellDayLoading: true,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PREDICTIONS:
      return { ...state, predictionDay: payload, predictionDayLoading: false };
    case GET_PREDICTIONS_FAIL:
      return { ...state, predictionDayLoading: false };
    case GET_BOT_BUY_SELL:
      return { ...state, botBuySellDay: payload, botBuySellDayLoading: false };
    case GET_BOT_BUY_SELL_FAIL:
      return { ...state, botBuySellDayLoading: false };
    default:
      return { ...state };
  }
}
