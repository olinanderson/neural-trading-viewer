import { combineReducers } from "redux";
import realtime from "./realtime";
import neural_network from "./neural_network";

export default combineReducers({
  realtime,
  neural_network,
});
