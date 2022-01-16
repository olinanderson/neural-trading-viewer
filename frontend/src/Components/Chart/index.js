import React, { Fragment, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import store from "../../store";

// React stock charts
import RealtimeChart from "./Chart";

const Realtime = ({
  ohlcDay,
  ohlcDayLoading,
  predictionDay,
  predictionDayLoading,
  botBuySellDay,
  botBuySellDayLoading,
}) => {
  if (
    ohlcDayLoading ||
    ohlcDay === undefined ||
    ohlcDay.ohlcArray.length === 0
  ) {
    return <Fragment>Loading candlestick data...</Fragment>;
  }

  if (
    predictionDayLoading ||
    predictionDay === undefined ||
    predictionDay.predictionDaysArray.length === 0
  ) {
    return <Fragment>Loading predictions...</Fragment>;
  }

  if (botBuySellDayLoading) {
    return <Fragment>Loading buy/sell decisions...</Fragment>;
  }

  return (
    <Fragment>
      <RealtimeChart
        ohlcArray={ohlcDay.ohlcArray}
        predictionArray={predictionDay.predictionDaysArray}
        botBuySellArray={botBuySellDay.botBuySellDaysArray}
      />
    </Fragment>
  );
};

Realtime.propTypes = {
  ohlcDay: PropTypes.object.isRequired,
  ohlcDayLoading: PropTypes.bool.isRequired,
  predictionDay: PropTypes.object.isRequired,
  predictionDayLoading: PropTypes.bool.isRequired,
  botBuySellDay: PropTypes.object.isRequired,
  botBuySellDayLoading: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  ohlcDay: state.realtime.ohlcDay,
  ohlcDayLoading: state.realtime.ohlcDayLoading,
  predictionDay: state.neural_network.predictionDay,
  predictionDayLoading: state.neural_network.predictionDayLoading,
  botBuySellDay: state.neural_network.botBuySellDay,
  botBuySellDayLoading: state.neural_network.botBuySellDayLoading,
});

export default connect(mapStateToProps, {})(Realtime);
