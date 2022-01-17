import {
  GET_BUY_SELL,
  GET_BUY_SELL_FAIL,
} from "../actions/types";

const initialState = {
  buySellDay: null,
  buySellDayLoading: true,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_BUY_SELL:
      return { ...state, buySellDay: payload, buySellDayLoading: false };
    case GET_BUY_SELL_FAIL:
      return { ...state, buySellDayLoading: false };
    default:
      return { ...state };
  }
}
