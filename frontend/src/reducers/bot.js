import {
  GET_PREDICTIONS,
  GET_PREDICTIONS_FAIL,
  GET_BOT_BUY_SELL,
  GET_BOT_BUY_SELL_FAIL,
} from "../actions/types";

const initialState = {
  prediction: {
    predictionDay: null,
    predictionDayLoading: true,
  },
  buySell: {
    botBuySellDay: null,
    botBuySellDayLoading: true,
  }
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PREDICTIONS:
      return { ...state, prediction: { ...state.prediction, predictionDay: payload, predictionDayLoading: false } };
    case GET_PREDICTIONS_FAIL:
      return { ...state, prediction: { ...state.prediction, predictionDayLoading: false } };
    case GET_BOT_BUY_SELL:
      return { ...state, buySell: { ...state.buySell, buySellDay: payload, buySellDayLoading: false } };
    case GET_BOT_BUY_SELL_FAIL:
      return { ...state, buySell: { ...state.buySell, buySellDayLoading: false } };
    default:
      return { ...state };
  }
}
