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

const Day = ({ ohlc, buySell, bot, getDailyData, resetDailyData }) => {

  // Local states
  const [value, setValue] = useState(new Date());
  const [dayLoading, setDayLoading] = useState(true);
  const [showBuySell, setShowBuySell] = useState(true);
  const [showBotBuySell, setShowBotBuySell] = useState(true);
  const [showPredictionChart, setShowPredictionChart] = useState(false);

  const { ohlcDay, daysList, isLoading } = ohlc;
  const { buySellDay } = buySell;
  const botBuySellDay = bot.buySell.buySellDay;

  const onChange = (value) => {
    setValue(value);
    setDayLoading(true);

    // Resetting and getting api requests
    resetDailyData();
    getDailyData(value.toDateString(), false);
  };

  useEffect(() => {
    if (!isLoading) {
      setDayLoading(false);
    }
  }, [isLoading]);

  const checkCharts = (dayLoading, showBuySell, showBotBuySell, showPredictionChart) => {
    if (dayLoading) {
      return <Spinner />;
    } else {
      return <Charts showBuySell={showBuySell} showBotBuySell={showBotBuySell} showPredictionChart={showPredictionChart} />;
    }
  };

  const inputOnClick = (e) => {


    console.log(e.target.checked);

    if (e.target.id === "showBuySell") {
      setShowBuySell(e.target.checked);
      console.log(showBuySell);
    }

  };

  const checkDailyStats = (ohlcDay, buySellDay, botBuySellDay) => {
    return (
      <div className="data-stats">
        <h1>Ticker: {ohlcDay.ticker}</h1>
        <div className="column">
          <p>Day: {ohlcDay.day}</p>
          <p>Optimized Buy/Sell Profit:  {(buySellDay.profit) ? (buySellDay.profit.toFixed(2)) : (0).toFixed(2)}%</p>
          <p>Bots decision parameters:
            <ul>
              <li>Trailing stop percentage: {botBuySellDay.trailingStopPercent}</li>
              <li>Long decision boundary: {botBuySellDay.longDecisionBoundary}</li>
              <li>Short decision boundary: {botBuySellDay.shortDecisionBoundary}</li>
            </ul>
          </p>
        </div>
        <div className="column">
          <p><input type="checkbox" defaultChecked={showBuySell} id="showBuySell" onChange={() => setShowBuySell(!showBuySell)} /><label>Show Optimized Buy/Sell</label><br /></p>
          <p><input type="checkbox" defaultChecked={showBotBuySell} id="showBotBuySell" onChange={inputOnClick} /><label>Show Bots Buy/Sell</label><br /></p>
          <p><input type="checkbox" defaultChecked={showPredictionChart} id="showPredictionChart" onChange={inputOnClick} /><label>Show Bots Prediction Chart</label><br /></p>
        </div>
      </div>
    );
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
        {checkDailyStats(ohlcDay, buySellDay, botBuySellDay)}
      </div>
      {checkCharts(dayLoading, showBuySell, showBotBuySell, showPredictionChart)}
    </Fragment>
  );
};

Day.propTypes = {
  ohlc: PropTypes.object.isRequired,
  buySell: PropTypes.object.isRequired,
  bot: PropTypes.object.isRequired,
  getDailyData: PropTypes.func.isRequired,
  resetDailyData: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  ohlc: state.ohlc,
  buySell: state.buySell,
  bot: state.bot
});

export default connect(mapStateToProps, { getDailyData, resetDailyData })(Day);
