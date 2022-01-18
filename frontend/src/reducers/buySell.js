import {
  GET_BUY_SELL,
  GET_BUY_SELL_FAIL,
  RESET_BUY_SELL,
} from "../actions/types";

const initialState = {
  buySellDay: {
    ticker: null,
    day: null,
    profit: 0,
    buySellDaysArray: []
  },
  isLoading: true,
};

export default function buySell(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_BUY_SELL:
      return { ...state, buySellDay: (payload !== null ? payload : state.buySellDay), isLoading: false };
    case GET_BUY_SELL_FAIL:
      return { ...state, isLoading: false };
    case RESET_BUY_SELL:
      return {
        ...initialState
      };
    default:
      return { ...state };
  }
}
