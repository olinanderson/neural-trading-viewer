// React
import { Fragment, useEffect, useState } from "react";
import "./App.css";

// Redux
import store from "./store";
import { Provider } from "react-redux";

// Actions
import { initialRequests } from "./actions/initial";

// Components
import Realtime from "./components/Chart";
import Day from "./components/Day";

function App() {
  useEffect(() => {
    store.dispatch(initialRequests());
  }, []);

  return (
    <Provider store={store}>
      <Day />
      {/* <Realtime /> */}
    </Provider>
  );
}

export default App;
