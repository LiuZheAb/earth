import React, { Component } from 'react';
import * as echarts from 'echarts';

export default class csvView_1d extends Component {
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        let { data } = this.props;
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
                }
            },
            tooltip: {
                show: true,
                formatter: params =>  'x: ' + params.data[0] + '<br>y: ' + params.data[1]
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
            <div id="chart" style={{ width: "100%", height: "100%" }}>

            </div>
        )
    }
}
