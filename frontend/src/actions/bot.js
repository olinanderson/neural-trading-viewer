import axios from "axios";

import {
  GET_BOT_BUY_SELL,
  GET_BOT_BUY_SELL_FAIL,
  GET_PREDICTIONS,
  GET_PREDICTIONS_FAIL,
} from "./types";

export const getBotBuySell = (day) => async (dispatch) => {
  try {
    let res = await axios.get("/api/bot/buySell", {
      params: {
        day: day
      }
    });

    await dispatch({
      type: GET_BOT_BUY_SELL,
      payload: res.data,
    });
  } catch (err) {
    await dispatch({
      type: GET_BOT_BUY_SELL_FAIL,
    });
  }
};

export const getPredictions = (day) => async (dispatch) => {
  try {
    let res = await axios.get("/api/bot/prediction", {
      params: {
        day: day
      }
    });

    await dispatch({
      type: GET_PREDICTIONS,
      payload: res.data,
    });
  } catch (err) {
    await dispatch({
      type: GET_PREDICTIONS_FAIL,
    });
  }
};
