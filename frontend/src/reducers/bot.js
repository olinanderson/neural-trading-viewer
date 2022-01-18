import {
  GET_PREDICTIONS,
  GET_PREDICTIONS_FAIL,
  GET_BOT_BUY_SELL,
  GET_BOT_BUY_SELL_FAIL,
  RESET_BOT
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
      trailingStopPercent: null,
      longDecisionBoundary: null,
      shortDecisionBoundary: null,
      resetDecisionBoundary: null,
      botBuySellDaysArray: []
    },
    isLoading: true,
  }
};

export default function bot(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PREDICTIONS:
      return { ...state, prediction: { ...state.prediction, predictionDay: (payload !== null ? payload : state.prediction.predictionDay), isLoading: false } };
    case GET_PREDICTIONS_FAIL:
      return { ...state, prediction: { ...initialState.prediction, isLoading: false } };
    case GET_BOT_BUY_SELL:
      return { ...state, buySell: { ...state.buySell, buySellDay: (payload !== null ? payload : state.buySell.buySellDay), isLoading: false } };
    case GET_BOT_BUY_SELL_FAIL:
      return { ...state, buySell: { ...initialState.buySell, isLoading: false } };
    case RESET_BOT:
      return {
        ...initialState
      };
    default:
      return { ...state };
  }
}
