import axios from "axios";

import { GET_BUY_SELL, GET_BUY_SELL_FAIL } from "./types";

export const getBuySell = (day) => async (dispatch) => {
    try {
        let res = await axios.get("/api/buySell", {
            params: {
                day: day
            }
        });

        await dispatch({
            type: GET_BUY_SELL,
            payload: res.data,
        });
    } catch (err) {
        await dispatch({
            type: GET_BUY_SELL_FAIL,
        });
    }
};

// buy 1642452600000
// sell 1642459980000