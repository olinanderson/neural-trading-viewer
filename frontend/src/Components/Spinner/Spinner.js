import React, { Fragment } from "react";
import spinner from "./spinner.gif";

const Spinner = () => (
  <Fragment>
    <img
      src={spinner}
      alt="Loading..."
      className="spinner"
      style={{
        width: "40px",
        height: "40px",
        display: "flex",
        justifyContent: " center",
        alignSelf: "center",
        margin: "auto",
      }}
    />
  </Fragment>
);

export default Spinner;
