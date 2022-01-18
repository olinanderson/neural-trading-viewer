import axios from "axios";

import { GET_OHLC, GET_OHLC_FAIL } from "./types";

export const getOHLC = (day) => async (dispatch) => {
  try {
    let res = await axios.get("/api/ohlc", {
      params: {
        day: day
      }
    });

    await dispatch({
      type: GET_OHLC,
      payload: res.data,
    });
  } catch (err) {
    await dispatch({
      type: GET_OHLC_FAIL,
    });
  }
};
