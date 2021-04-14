import React, { Component } from 'react';
import * as echarts from 'echarts';

export default class csvView_1d extends Component {
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        let { data } = this.props;
        let yDataMap = {}, xData = [];
        data = data[0].map((col, i) => data.map(row => row[i]));
        for(let i=0,len=data.length;i<len;i++){
            let key = data[i][0].replace(/%| /g, "");
            data[i].shift();
            if (key === "x") {
                xData = data[i];
            }
            if (!["x", "y", "z"].includes(key)) {
                yDataMap[key] = data[i]
            }
        }
        // data.map(item => {
        //     let key = item[0].replace(/%| /g, "");
        //     item.shift();
        //     if (key === "x") {
        //         xData = item;
        //     }
        //     if (!["x", "y", "z"].includes(key)) {
        //         yDataMap[key] = item
        //     }
        // })
        let legends = Object.keys(yDataMap);
        let series = legends.map((item, index) => ({
            name: item,
            type: 'line',
            data: yDataMap[item]
        }))
        let option = {
            tooltip: {
                trigger: 'axis',
            },
            legend: {
                data: legends,
                selectedMode: "single"
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xData
            },
            yAxis: {
                type: 'value'
            },
            series: series,
        };
        this.chart.setOption(option);

        window.addEventListener("resize", () => {
            this.chart.resize();
        });
    }
    render() {
        return (
            <div style={{ padding: 20, width: "100%", height: "100%" }}>
                <div id="chart" style={{ width: "100%", height: "100%" }}></div>
            </div>
        )
    }
}
