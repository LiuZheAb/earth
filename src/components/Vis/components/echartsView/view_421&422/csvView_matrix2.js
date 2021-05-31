import React, { Component } from 'react';
import Heatmap from 'heatmap.js';
// import axios from "axios";
import "./index2.css";

let getMax = arr => {
    var max = arr[0];
    for (var i = 0; i < arr.length; i++) {
        if (max < arr[i]) {
            max = arr[i];
        }
    }
    return max;
}
//获取最小值
let getMin = arr => {
    var min = arr[0];
    for (var i = 0; i < arr.length; i++) {
        if (min > arr[i]) {
            min = arr[i];
        }
    }
    return min;
}
export default class csvView_matrix extends Component {
    constructor(props) {
        super(props)

        this.state = {
            data: [],
            dataMap: [],
            dataKey: "",
            legendMap: [],
            xAxisData: [],
            yAxisData: []
        }
    }
    componentDidMount() {
        let { data } = this.props;
        let yData = [], xData = [], dataMap = [];
        data = data[0].map((col, i) => data.map(row => row[i]));
        for (let i = 0, len = data.length; i < len; i++) {
            let key = data[i][0].replace(/%| /g, "");
            data[i].shift();
            if (key === "xcent") {
                xData = data[i].map(item => Number(item));
            } else if (key === "ycent") {
                yData = data[i].map(item => Number(item));
            } else if (key === "sigma_inv") {
                dataMap = data[i].map(item => Number(item));
            }
        }
        let xMin = getMin(xData), xMax = getMax(xData), yMin = getMin(yData), yMax = getMax(yData), max = getMax(dataMap), min = getMin(dataMap);
        let xRange = xMax - xMin, yRange = yMax - yMin;
        let dataSource = [], xAxisData = [], yAxisData = [];
        let chart = document.getElementById("matrix_chart");
        for (let i = 0, len = dataMap.length; i < len; i++) {
            dataSource.push({
                x: (xData[i] - xMin) / xRange * chart.clientWidth,
                y: ((yMax - yData[i]) / yRange) * chart.clientHeight,
                value: dataMap[i]
            });
        }
        for (let i = xMin; i <= xMax; i++) {
            if (i % 400 === 0) {
                xAxisData.push({ value: i, offset: (i - xMin) / xRange * 100 });
            }
        }
        for (let i = Number(yMax.toFixed(0)); i >= yMin; i--) {
            if (i % 400 === 0) {
                yAxisData.push({ value: i, offset: (yMax - i) / yRange * 100 });
            }
        }
        let legendDataSource = [];
        for (let i = max; i > min; i -= (max - min) / 9) {
            legendDataSource.push(i.toFixed(4))
        }
        this.map = Heatmap.create({
            container: chart,
            radius: 2.6,
            maxOpacity: 1,
            minOpacity: 1,
            blur: 1,
            backgroundColor: "#ffffff",
            gradient: {
                "0": "#3e29aa",
                "0.02857142857142857": "#4330be",
                "0.05714285714285714": "#4738d1",
                "0.08571428571428572": "#4740de",
                "0.11428571428571428": "#4849e2",
                "0.14285714285714285": "#4754ef",
                "0.17142857142857143": "#465ef4",
                "0.19999999999999998": "#4267f6",
                "0.22857142857142856": "#3b71f7",
                "0.2571428571428571": "#337aee",
                "0.2857142857142857": "#2e87ef",
                "0.3142857142857143": "#2b8ee9",
                "0.34285714285714286": "#2797e3",
                "0.37142857142857144": "#239fdf",
                "0.39999999999999997": "#1fa2d6",
                "0.42857142857142855": "#15add2",
                "0.45714285714285713": "#07b1c8",
                "0.4857142857142857": "#09b6bd",
                "0.5142857142857142": "#1bbbb1",
                "0.5428571428571428": "#2dbda4",
                "0.5714285714285714": "#35c097",
                "0.6": "#42c68a",
                "0.6285714285714286": "#57c878",
                "0.6571428571428571": "#6fc967",
                "0.6857142857142857": "#86c753",
                "0.7142857142857143": "#9cc140",
                "0.7428571428571429": "#b4c030",
                "0.7714285714285714": "#cabb2a",
                "0.7999999999999999": "#dab92c",
                "0.8285714285714285": "#ecb63a",
                "0.8571428571428571": "#f3b73d",
                "0.8857142857142857": "#f8c337",
                "0.9142857142857143": "#f4cd30",
                "0.9428571428571428": "#f1da2c",
                "0.9714285714285714": "#eee423",
                "1": "#edea1f",
            }
        });
        this.map.setData({
            max: max,
            min: min,
            data: dataSource
        });
        this.setState({
            dataMap,
            xAxisData,
            yAxisData,
            dataSource,
            legendMap: legendDataSource,
        });
    }
    render() {
        let { legendMap, xAxisData, yAxisData } = this.state;
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div id="chart-container-2">
                    <div id="matrix_chart"></div>
                    <div id="legend">
                        <div className="color-bar"></div>
                        <div className="color-num">
                            {legendMap.map(item => <span key={item}>{item}</span>)}
                        </div>
                    </div>
                    <div id="x-axis">
                        {xAxisData.map(item => <span key={item.value} style={{ left: item.offset + "%" }}>{item.value}</span>)}
                    </div>
                    <div id="y-axis">
                        {yAxisData.map(item => <span key={item.value} style={{ top: item.offset + "%" }}>{item.value}</span>)}
                    </div>
                </div>
            </div>
        )
    }
}
