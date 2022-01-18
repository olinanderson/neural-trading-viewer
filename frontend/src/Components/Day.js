// React 
import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";

// Redux
import { connect } from "react-redux";
import store from "../store";

// External Packages 
import Calendar from 'react-calendar';
import Charts from "./Charts/Charts";

import 'react-calendar/dist/Calendar.css';
import Spinner from "./Spinner/Spinner";

// Actions
import { getDailyData } from "../actions/getDailyData";
import { resetDailyData } from "../actions/general";

const Day = ({ ohlc, getDailyData, resetDailyData }) => {

  // Local states
  const [value, setValue] = useState(new Date());
  const [dayLoading, setDayLoading] = useState(true);

  const { daysList, isLoading } = ohlc;

  const onChange = (value) => {
    setValue(value);
    setDayLoading(true);

    resetDailyData();

    getDailyData(value.toDateString(), false);
  };

  useEffect(() => {
    console.log("isLoading", isLoading);
    if (!isLoading) {
      setDayLoading(false);
    }
  }, [isLoading]);

  const check = (dayLoading) => {
    if (dayLoading) {
      return <Spinner />;
    } else {
      return <Charts />;
    }
  };

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
      </div>
      {check(dayLoading)}
    </Fragment>
  );
};

Day.propTypes = {
  ohlc: PropTypes.object.isRequired,
  getDailyData: PropTypes.func.isRequired,
  resetDailyData: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  ohlc: state.ohlc
});

export default connect(mapStateToProps, { getDailyData, resetDailyData })(Day);
