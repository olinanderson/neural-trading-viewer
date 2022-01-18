import {
  GET_BUY_SELL,
  GET_BUY_SELL_FAIL,
} from "../actions/types";

const initialState = {
  buySellDay: {
    ticker: null,
    day: null,
    buySellDaysArray: []
  },
  isLoading: true,
};

export default function buySell(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_BUY_SELL:
      return { ...state, buySellDay: payload, isLoading: false };
    case GET_BUY_SELL_FAIL:
      return { ...state, isLoading: false };
    default:
      return { ...state };
  }
}
