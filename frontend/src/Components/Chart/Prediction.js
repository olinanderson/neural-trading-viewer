import { React, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import _ from "lodash";


import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
    BarSeries,
    CandlestickSeries,
    LineSeries,
    RSISeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
    EdgeIndicator,
    CurrentCoordinate,
    MouseCoordinateX,
    MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
    OHLCTooltip,
    MovingAverageTooltip,
    RSITooltip,
    SingleValueTooltip,
} from "react-stockcharts/lib/tooltip";
import { ema, rsi, sma } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";
import {
    Annotate,
    SvgPathAnnotation,
    buyPath,
    sellPath,
} from "react-stockcharts/lib/annotation";

const Prediction = ({ predictionHeight, sma45, predictionSma10 }) => {

    <Chart
        id={4}
        yExtents={[0, 1]}
        xAccessor={(d) => d.date}
        height={predictionHeight}
        origin={(w, h) => [0, h - predictionHeight]}
        padding={{ top: 10, bottom: 10 }}
    >
        <XAxis axisAt="bottom" orient="bottom" showTicks={true} />
        <YAxis axisAt="right" orient="right" tickValues={[0, 0.5, 1]} />

        <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat("%I:%M %p")}
        />
        <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")}
        />

        <CurrentCoordinate yAccessor={(d) => d.prediction} fill={"#2ca02c"} />
        <CurrentCoordinate yAccessor={sma45.accessor()} fill={sma45.stroke()} />

        <LineSeries yAccessor={(d) => d.prediction} stroke="#2ca02c" />
        <LineSeries
            yAccessor={predictionSma10.accessor()}
            stroke={predictionSma10.stroke()}
        />

        <SingleValueTooltip
            yAccessor={(d) => d.prediction}
            yLabel={"Prediction"}
            yDisplayFormat={format(".2f")}
            origin={[-40, 15]}
        />

        <SingleValueTooltip
            yAccessor={(d) => d.predictionSma10}
            yLabel={"SMA10"}
            yDisplayFormat={format(".2f")}
            origin={[-40, 15]}
        />
    </Chart>;
};

export default Prediction;