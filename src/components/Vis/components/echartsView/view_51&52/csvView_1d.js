import React, { Component } from 'react';
import * as echarts from 'echarts';

//获取最大值
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

export default class csvView_1d extends Component {
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        let { data, appName } = this.props;
        let data_new = data[0].map((col, i) => data.map(row => row[i]));
        if (data[0].length === 1) {
            data.map((item, index) =>
                item.unshift(index)
            )
        }
        let option = {
            xAxis: {
                name: "x",
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: "bold"
                }
            },
            yAxis: {
                name: "y",
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: "bold"
                },
                max: appName === "线性求解器(实/复) (Linear Solver)" ? getMax(data_new[0]) * 10 : undefined,
                min: appName === "线性求解器(实/复) (Linear Solver)" ? getMin(data_new[0]) * 10 : undefined
            },
            tooltip: {
                show: true,
                formatter: params => 'x: ' + params.data[0] + '<br>y: ' + params.data[1]
            },
            series: [{
                symbolSize: 8,
                data,
                type: 'line',
                itemStyle: {
                    color: "#1890ff"
                }
            }]
        };
        this.chart.setOption(option);

        window.addEventListener("resize", () => {
            this.chart.resize();
        });
    }
    render() {
        return (
            <div id="chart" style={{ width: "100%", height: "100%" }}/>
        )
    }
}
