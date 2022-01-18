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


const Day = () => {

  const [value, onChange] = useState(new Date());

  return (
    <Fragment>
      <div className="daily-container">
        <Calendar
          onChange={onChange}
          value={value}
        />
        <Charts />
      </div>
    </Fragment>
  );
};

Day.propTypes = {
};

const mapStateToProps = (state) => ({
});

export default connect(mapStateToProps, {})(Day);
