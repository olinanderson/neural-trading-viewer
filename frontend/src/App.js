// React
import { Fragment, useEffect, useState } from "react";
import "./App.css";

// Redux
import store from "./store";
import { Provider } from "react-redux";

// Actions
import { getDailyData } from "./actions/getDailyData";

// Components
import Day from "./Components/Day";

function App() {
  useEffect(() => {
    store.dispatch(getDailyData(new Date().toDateString(), true));
  }, []);

  return (
    <Provider store={store}>
      <Day />
    </Provider>
  );
}

export default App;
