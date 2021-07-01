import React, { Component } from 'react';
import * as echarts from 'echarts';

export default class csvView_1d extends Component {
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        let { data, datatype } = this.props;
        let xData = datatype === "圆盘模型正演" ? data.xarray : datatype === "二维多边形正演" || datatype === "二维多边形反演" ? data.x : data.gravity.map((item, index) => index);
        let dataKey = datatype === "二维多边形反演" ? "estimated" : "gravity";
        let max = Math.max(...data[dataKey]), min = Math.min(...data[dataKey]), range = max - min;
        let option = {
            xAxis: {
                name: "x",
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: "bold"
                },
                data: xData,
            },
            yAxis: {
                name: dataKey,
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: "bold"
                },
                max: range === 0 ? max + 10 : min > range ? Number((max + range).toFixed(0)) : Number((max + min).toFixed(0)),
                min: range === 0 ? min - 10 : min > range ? Number((min - range).toFixed(0)) : 0
            },
            tooltip: {
                show: true,
                trigger: 'axis',
                formatter: params => `x: ${params[0].axisValue}<br>${dataKey}: ${params[0].value}`
            },
            series: [{
                name: "a",
                showSymbol: false,
                data: data[dataKey],
                type: 'line',
                smooth: true,
            }]
        };
        this.chart.setOption(option);

        window.addEventListener("resize", () => {
            this.chart.resize();
        });
    }
    render() {
        return (
            <div id="chart" style={{ width: "100%", height: "100%" }} />
        )
    }
}
