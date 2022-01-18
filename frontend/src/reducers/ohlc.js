import { GET_OHLC, GET_OHLC_FAIL } from "../actions/types";

const initialState = {
  ohlcDay: {
    ticker: null,
    day: null,
    ohlcArray: []
  },
  isLoading: true
};

export default function ohlc(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_OHLC:
      return { ...state, ohlcDay: payload, isLoading: false };
    case GET_OHLC_FAIL:
      return { ...state, isLoading: false };
    default:
      return { ...state };
  }
}
