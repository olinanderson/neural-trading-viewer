import {
  GET_PREDICTIONS,
  GET_PREDICTIONS_FAIL,
  GET_BOT_BUY_SELL,
  GET_BOT_BUY_SELL_FAIL,
} from "../actions/types";

const initialState = {
  prediction: {
    predictionDay: {
      ticker: null,
      day: null,
      predictionDaysArray: []
    },
    isLoading: true,
  },
  buySell: {
    buySellDay: {
      ticker: null,
      day: null,
      railingStopPercent: null,
      longDecisionBoundary: null,
      shortDecisionBoundary: null,
      resetDecisionBoundary: null,
      botBuySellDaysArray: []
    },
    isLoading: true,
  }
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PREDICTIONS:
      return { ...state, prediction: { ...state.prediction, predictionDay: payload, isLoading: false } };
    case GET_PREDICTIONS_FAIL:
      return { ...state, prediction: { ...state.prediction, isLoading: false } };
    case GET_BOT_BUY_SELL:
      return { ...state, buySell: { ...state.buySell, buySellDay: payload, isLoading: false } };
    case GET_BOT_BUY_SELL_FAIL:
      return { ...state, buySell: { ...state.buySell, isLoading: false } };
    default:
      return { ...state };
  }
}
