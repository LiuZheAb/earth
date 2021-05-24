import React, { Component } from 'react';
import Heatmap from 'heatmap.js';
import axios from "axios";
import "./index2.css";

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
        axios.get("./static/data/temp/g2exp.grd").then(res => {
            let data = res.data.split("\r\n");
            data = data.map(item => item.trim().replace(/\s+/g, " ").split(" "))
            for (let i = 0; i < data.length; i++) {
                if (data[i][0] === "") {
                    data.splice(i, 1)
                }
            }
            data = data.map(arr => arr.map(item => isNaN(Number(item)) ? item : Number(item)))
            let xNum = data[1][0], yNum = data[1][1], xMin = data[2][0], xMax = data[2][1], yMin = data[3][0], yMax = data[3][1], zMin = data[4][0], zMax = data[4][1];
            let xRange = xMax - xMin, yRange = yMax - yMin;
            let dataSource = [], xAxisData = [], yAxisData = [];
            let chart = document.getElementById("matrix_chart");
            for (let i = 0; i < xNum; i++) {
                for (let j = 0; j < yNum; j++) {
                    dataSource.push({
                        x: j / (xNum - 1) * chart.clientWidth,
                        y: (xNum - 1 - i) / (yNum - 1) * chart.clientHeight,
                        value: data[i + 4][j]
                    });
                }
                xAxisData.push({ value: (xMin + xRange / xNum * i).toFixed(1), offset: 1 / (xNum - 1) * i * 100 });
            }
            for (let i = 0; i < yNum; i++) {
                yAxisData.push({ value: (yMin + yRange / yNum * i).toFixed(2), offset: 1 / (yNum - 1) * i * 100 });
            }
            let legendDataSource = [];
            for (let i = zMin; i < zMax; i += (zMax - zMin) / 9) {
                legendDataSource.push(i.toFixed(4))
            }
            legendDataSource.push(zMax.toFixed(4));
            this.map = Heatmap.create({
                container: chart,
                radius: 32,
                maxOpacity: 1,
                minOpacity: 1,
                blur: 1,
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
            this.map.setData({
                max: zMax,
                min: zMin,
                data: dataSource
            });
            this.setState({
                data,
                xAxisData,
                yAxisData,
                dataSource,
                legendMap: legendDataSource,
            });
        })
    }
    render() {
        let { legendMap, xAxisData, yAxisData } = this.state;
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div>
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
