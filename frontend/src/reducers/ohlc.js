import {
  GET_OHLC,
  GET_OHLC_FAIL,
  GET_OHLC_DAYS_LIST,
  GET_OHLC_DAYS_LIST_FAIL,
  RESET_OHLC
} from "../actions/types";

const initialState = {
  ohlcDay: {
    ticker: null,
    day: null,
    ohlcArray: []
  },
  isLoading: true,
  daysList: [] // A list of all the days that are currently in the database for this ticker
};

export default function ohlc(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_OHLC:
      return { ...state, ohlcDay: (payload !== null ? payload : state.state.ohlcDay), isLoading: false };
    case GET_OHLC_FAIL:
      return { ...state, isLoading: false };
    case GET_OHLC_DAYS_LIST:
      return { ...state, daysList: payload };
    case GET_OHLC_DAYS_LIST_FAIL:
      return { ...state };
    case RESET_OHLC:
      return {
        ...initialState,
        daysList: state.daysList
      };
    default:
      return { ...state };
  }
}
