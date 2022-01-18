import axios from "axios";

import {
  GET_OHLC,
  GET_OHLC_FAIL,
  GET_OHLC_DAYS_LIST,
  GET_OHLC_DAYS_LIST_FAIL
} from "./types";

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

export const getDaysList = () => async (dispatch) => {
  try {

    let res = await axios.get("/api/ohlc/daysList");

    dispatch({
      type: GET_OHLC_DAYS_LIST,
      payload: res.data,
    });

  } catch (err) {
    await dispatch({
      type: GET_OHLC_DAYS_LIST_FAIL,
    });

  }
};