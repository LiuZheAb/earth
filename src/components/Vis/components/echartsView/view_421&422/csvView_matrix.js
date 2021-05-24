import React, { Component } from 'react';
import { Select } from "antd";
import Heatmap from 'heatmap.js';
import "./index.css";

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
            dataMap: [],
            dataOptions: [],
            dataKey: "",
            legendMap: [],
            xAxisData: [],
            yAxisData: []
        }
    }
    componentDidMount() {
        let { data } = this.props;
        console.log(data);
        let yData = [], xData = [], dataMap = {};
        data = data[0].map((col, i) => data.map(row => row[i]));
        for (let i = 0, len = data.length; i < len; i++) {
            let key = data[i][0].replace(/%| /g, "");
            data[i].shift();
            if (key === "x") {
                xData = data[i].map(item => Number(item));
            }
            if (key === "z") {
                yData = data[i].map(item => Number(item));
            }
            if (!["x", "y", "z"].includes(key)) {
                dataMap[key] = data[i].map(item => Number(item));
            }
        }
        let dataOptions = Object.keys(dataMap);
        let xMin = getMin(xData), xMax = getMax(xData), yMin = getMin(yData), yMax = getMax(yData);
        let xRange = xMax - xMin, yRange = yMax - yMin;
        let dataSource = [], xAxisData = [], yAxisData = [];
        let chart = document.getElementById("matrix_chart");
        for (let i = 0, len = dataMap[dataOptions[0]].length; i < len; i++) {
            dataSource.push({
                x: (xData[i] - xMin) / xRange * chart.clientWidth,
                y: (yData[i] - yMin) / yRange * chart.clientHeight,
                value: Math.log10(Math.abs(dataMap[dataOptions[0]][i]))
            });
        }
        for (let i = xMin; i <= xMax; i++) {
            if (i % 200 === 0) {
                xAxisData.push({ value: i, offset: (i - xMin) / xRange * 100 });
            }
        }
        for (let i = Number(yMin.toFixed(0)); i <= yMax; i++) {
            if (i % 100 === 0) {
                yAxisData.push({ value: i, offset: (i - yMin) / yRange * 100 });
            }
        }
        this.map = Heatmap.create({
            container: chart,
            radius: chart.clientWidth / 160,
            maxOpacity: .85,
            minOpacity: 1,
            blur: chart.clientWidth / 1600,
            backgroundColor: "#ffffff",
            gradient: {
                "0": '#362f86',
                ".143": '#0662e1',
                ".286": '#118ad1',
                ".429": '#0dafbc',
                ".571": '#64bf85',
                ".714": '#c2bc5f',
                ".857": '#ffc23a',
                "1": '#f5ff13'
            }
        });
        this.setState({
            dataOptions,
            dataKey: dataOptions[0],
            dataMap,
            xAxisData,
            yAxisData,
            dataSource
        }, () => {
            this.chartRender(dataSource);
        });
    }
    chartRender(dataSource) {
        let { dataMap, dataKey } = this.state;
        let newData = dataMap[dataKey].map(item => Math.log10(Math.abs(item)));
        let min = getMin(newData), max = getMax(newData);
        let legendDataSource = newData.map(i => i.toFixed(1)).sort((a, b) => a - b);
        let legendDataCount = {};
        for (let i = 0, len = legendDataSource.length; i < len; i++) {
            let key = legendDataSource[i];
            if (legendDataCount[key]) {
                legendDataCount[key] += 1;
            } else {
                legendDataCount[key] = 1;
            }
        }
        let legendData = [];
        for (let key in legendDataCount) {
            if (legendDataCount[key] > 3) {
                legendData.push(Number(key))
            }
        }
        min = getMin(legendData);
        max = getMax(legendData)
        this.map.setData({
            max,
            min,
            data: dataSource
        });
        let legendMap = [];
        if (max === min) {
            legendMap.push(String(max).length > 3 ? Number(max.toFixed(2)) : max);
        } else {
            for (let i = max; i >= min; i -= (max - min) / 8) {
                legendMap.push(String(i).length > 3 ? Number(i.toFixed(2)) : i);
            }
        }
        this.setState({
            legendMap,
        });
    }
    handleKeyChange = value => {
        let { dataMap, dataSource } = this.state;
        for (let i = 0, len = dataSource.length; i < len; i++) {
            dataSource[i].value = Math.log10(Math.abs(dataMap[value][i]))
        }
        this.setState({ dataKey: value, dataSource }, () => {
            this.chartRender(dataSource);
        });
    }
    render() {
        let { dataOptions, dataKey, legendMap, xAxisData, yAxisData } = this.state;
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div>
                    <span>请选择数据：</span>
                    <Select onChange={this.handleKeyChange} style={{ width: 200 }} placeholder="请选择数据" value={dataKey}>
                        {dataOptions.map(item =>
                            <Select.Option value={item} key={item}>{item}</Select.Option>
                        )}
                    </Select>
                    <div id="chart-container">
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
            </div>
        )
    }
}
