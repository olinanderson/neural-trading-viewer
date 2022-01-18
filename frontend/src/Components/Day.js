// React 
import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";

// Redux
import { connect } from "react-redux";
import store from "../store";

// External Packages 
import Calendar from 'react-calendar';
import Charts from "./Charts/Charts";

import 'react-calendar/dist/Calendar.css';
import Spinner from "./Spinner/Spinner";



const Day = ({ daysList }) => {

  const [value, onChange] = useState(new Date());

  return (
    <Fragment>
      <div className="daily-container">
        <Calendar
          onChange={onChange}
          value={value}
          tileDisabled={({ activeStartDate, date, view }) => {

            var bool = true;

            if (date.getDay() === 0 || date.getDay() === 6) {
              bool = true;
            }

            if (daysList.length) {
              for (let i = 0; i < daysList.length; i++) {
                if (daysList[i] === date.toDateString()) {
                  bool = false;
                }
              }
            }
            return bool;
          }}
        />

        <Charts />
      </div>
    </Fragment>
  );
};

Day.propTypes = {
  daysList: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
  daysList: state.ohlc.daysList
});

export default connect(mapStateToProps, {})(Day);
