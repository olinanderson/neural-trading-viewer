import { GET_OHLC, GET_OHLC_FAIL } from "../actions/types";

const initialState = { ohlcDay: {}, ohlcDayLoading: true };

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_OHLC:
      return { ...state, ohlcDay: payload, ohlcDayLoading: false };
    case GET_OHLC_FAIL:
      return { ...state, ohlcDayLoading: false };
    default:
      return { ...state };
  }
}
