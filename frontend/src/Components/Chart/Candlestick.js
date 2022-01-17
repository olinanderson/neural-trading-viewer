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


const Candlestick = ({ sma20, sma45, longAnnotationProps, shortAnnotationProps, candleStickHeight, volumeHeight, rsiHeight, predictionHeight, rsiCalculator }) => {

    return (
        <Fragment>
            <Chart
                id={1}
                height={candleStickHeight}
                yExtents={[(d) => [d.high, d.low], sma20.accessor()]}
                padding={{ top: 40, bottom: 20 }}
            >
                <XAxis
                    axisAt="bottom"
                    orient="bottom"
                    showTicks={false}
                    outerTickSize={0}
                />
                <YAxis axisAt="right" orient="right" ticks={5} />

                <MouseCoordinateY
                    at="right"
                    orient="right"
                    displayFormat={format(".2f")}
                />
                {/* 
        <MouseCoordinateX
          at="bottom"
          orient="bottom"
          displayFormat={timeFormat("%I:%M %p")}
        /> */}

                <CandlestickSeries />
                <LineSeries yAccessor={sma20.accessor()} stroke={sma20.stroke()} />
                <LineSeries yAccessor={sma45.accessor()} stroke={sma45.stroke()} />
                <Annotate
                    with={SvgPathAnnotation}
                    when={(d) => d.buy === 1}
                    usingProps={longAnnotationProps}
                />
                <Annotate
                    with={SvgPathAnnotation}
                    when={(d) => d.sell === 1}
                    usingProps={shortAnnotationProps}
                />
                <CurrentCoordinate yAccessor={sma20.accessor()} fill={sma20.stroke()} />
                <CurrentCoordinate yAccessor={sma45.accessor()} fill={sma45.stroke()} />

                <EdgeIndicator
                    itemType="last"
                    orient="right"
                    edgeAt="right"
                    yAccessor={(d) => d.close}
                    fill={(d) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                />

                <OHLCTooltip origin={[-40, 0]} />

                <MovingAverageTooltip
                    onClick={(e) => console.log(e)}
                    origin={[-38, 15]}
                    options={[
                        {
                            yAccessor: sma20.accessor(),
                            type: "SMA",
                            stroke: sma20.stroke(),
                            windowSize: sma20.options().windowSize,
                        },
                        {
                            yAccessor: sma45.accessor(),
                            type: "SMA",
                            stroke: sma45.stroke(),
                            windowSize: sma45.options().windowSize,
                        },
                    ]}
                />
            </Chart>
            <Chart
                id={2}
                height={volumeHeight}
                yExtents={[(d) => d.volume]}
                origin={(w, h) => [0, candleStickHeight - volumeHeight]}
            >
                <YAxis
                    axisAt="left"
                    orient="left"
                    ticks={5}
                    tickFormat={format(".2s")}
                />

                <MouseCoordinateY
                    at="left"
                    orient="left"
                    displayFormat={format(".4s")}
                />

                <BarSeries
                    yAccessor={(d) => d.volume}
                    fill={(d) => (d.close > d.open ? "#a3ccb4" : "#d18888")}
                />
            </Chart>
            <Chart
                id={3}
                yExtents={[0, 100]}
                height={rsiHeight}
                // padding={{ top: 10, bottom: 10 }}
                origin={(w, h) => [0, h - rsiHeight - predictionHeight]}
            >
                <XAxis
                    axisAt="bottom"
                    orient="bottom"
                    showTicks={false}
                    outerTickSize={0}
                />
                <YAxis axisAt="right" orient="right" tickValues={[30, 50, 70]} />
                <MouseCoordinateY
                    at="right"
                    orient="right"
                    displayFormat={format(".2f")}
                />

                <CurrentCoordinate
                    yAccessor={rsiCalculator.accessor()}
                    fill={rsiCalculator.stroke()}
                />

                <RSISeries yAccessor={(d) => d.rsi} />

                <RSITooltip
                    origin={[-40, 15]}
                    yAccessor={(d) => d.rsi}
                    options={rsiCalculator.options()}
                />
            </Chart>
        </Fragment>
    );
};

export default Candlestick;