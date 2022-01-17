// React 
import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";

// Redux
import { connect } from "react-redux";
import store from "../store";

// External Packages 
import DatePicker from 'react-date-picker';
import Charts from "./Charts/Charts";


const Day = ({ ohlc, buySell, bot }) => {


  const [value, onChange] = useState(new Date());


  return (
    <Fragment>
      <div className="daily-container">
        <DatePicker
          onChange={onChange}
          value={value}
        />
        <Charts />
      </div>
    </Fragment>
  );
};

Day.propTypes = {
  ohlc: PropTypes.object,
  buySell: PropTypes.object,
  bot: PropTypes.object,
};

const mapStateToProps = (state) => ({
  ohlc: state.ohlc,
  buySell: state.buySell,
  bot: state.bot,
});

export default connect(mapStateToProps, {})(Day);
