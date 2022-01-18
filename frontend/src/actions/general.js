import axios from "axios";

import { RESET_OHLC, RESET_BUY_SELL, RESET_BOT, RESET_ALL_FAIL } from "./types";

export const resetDailyData = () => async (dispatch) => {
    try {
        dispatch({ type: RESET_OHLC });
        dispatch({ type: RESET_BUY_SELL });
        dispatch({ type: RESET_BOT });
    } catch (err) {
        dispatch({
            type: RESET_ALL_FAIL
        });
    }
};