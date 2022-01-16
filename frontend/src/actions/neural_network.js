import axios from "axios";

import {
  GET_BOT_BUY_SELL,
  GET_BOT_BUY_SELL_FAIL,
  GET_PREDICTIONS,
  GET_PREDICTIONS_FAIL,
} from "./types";

export const getBotBuySell = () => async (dispatch) => {
  try {
    let res = await axios.get("/api/neural_network/bot_buy_sell/initial");

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

export const getPredictions = () => async (dispatch) => {
  try {
    let res = await axios.get("/api/neural_network/predictions/initial");

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
