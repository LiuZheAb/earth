/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : CPU、内存监控组件
 */

import React from 'react';
import axios from 'axios';
import DataSet from "@antv/data-set";
import { Divider, message } from 'antd';
import { Chart, Geom, Axis, Tooltip, Coord, Label, View, } from "bizcharts";

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
export default class Listener extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pieData: [],
            lineData: [],
            minLineData: 0,
            maxLineData: 100,
            ip: props.ip ? props.ip : props.uri && props.uri.split("://")[1].split(":")[0],
            memoryUsed: undefined,
            cpuUsed: undefined,
            gotPie: true,
            gotLine: true
        };
    };
    pieTimer = undefined;
    lineTimer = undefined;
    requestRef = undefined;
    componentDidMount() {
        this.getPieData();
        this.getLineData();
    }
    // 获取内存饼图数据
    getPieData = () => {
        let { gotPie, ip } = this.state;
        let times = 0;
        if (ip) {
            this.pieTimer = setInterval(() => {
                if (gotPie) {
                    this.setState({ gotPie: false });
                    axios.get("http://" + ip + ':8666/monitor/memory'
                    ).then(response => {
                        this.setState({
                            gotPie: true,
                            pieData: response.data,
                            memoryUsed: Number(response.data[0].value.toFixed(2)),
                            memoryUsed2: ((Number(response.data[0].value) + Number(response.data[1].value)) / (Number(response.data[0].value) + Number(response.data[1].value) + Number(response.data[2].value)) * 100).toFixed(2)
                        });
                    }).catch(error => {
                        this.setState({ gotLine: true });
                        times += 1;
                        if (times > 3) {
                            message.error("服务器无响应", 2);
                            clearInterval(this.pieTimer);
                        }
                    });
                }
            }, 3000);
        }
    };
    // 获取CPU折线图数据
    getLineData = () => {
        let { gotLine, ip } = this.state;
        let times = 0;
        if (ip) {
            this.requestRef = requestAnimationFrame(() => {
                this.lineTimer = setInterval(() => {
                    if (gotLine) {
                        this.setState({ gotLine: false });
                        axios.get("http://" + ip + ':8666/monitor/cpu')
                            .then(response => {
                                let lineData = response.data.map(item => ({ time: item.time, value: Number(item.value.toFixed(2)) }));
                                let lineValue = response.data.map(item => Number(item.value.toFixed(2)));
                                let minLineData = Math.floor(Number(getMin(lineValue).toFixed(0)) / 10) * 10;
                                let maxLineData = Math.ceil(Number(getMax(lineValue).toFixed(0)) / 10) * 10;
                                this.setState({
                                    lineData, minLineData, maxLineData, cpuUsed: lineValue.pop(), gotLine: true
                                })
                            }).catch(error => {
                                this.setState({ gotLine: true });
                                times += 1;
                                if (times > 3) {
                                    message.error("服务器无响应", 2);
                                    clearInterval(this.lineTimer);
                                }
                            });
                    }
                }, 2000);
            });
        }
    };
    // 页面注销时清空计时器
    componentWillUnmount() {
        clearInterval(this.pieTimer);
        clearInterval(this.lineTimer);
    };
    render() {
        const { DataView } = DataSet;
        let { pieData, lineData, minLineData, maxLineData, memoryUsed, memoryUsed2, cpuUsed } = this.state;
        let { toggle } = this.props;
        const dv = new DataView();
        dv.source(pieData).transform({
            type: "percent",
            field: "value",
            dimension: "type",
            as: "percent"
        });
        const cols = {
            percent: {
                formatter: val => {
                    val = `${(val * 100).toFixed(2)}%`;
                    return val;
                }
            }
        };
        const dv1 = new DataView();
        dv1.source(pieData).transform({
            type: 'percent',
            field: 'value',
            dimension: 'name',
            as: 'percent',
        });
        const cols1 = {
            value: {
                alias: "CPU使用率(%)",
                min: minLineData,
                max: maxLineData
            },
            time: {
                alias: "时间",
            },
            percent: {
                formatter: val => {
                    val = `${(val * 100).toFixed(2)}%`;
                    return val;
                }
            }
        };
        return toggle ?
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <div style={{ width: 140, display: "flex", justifyContent: "space-between" }}>
                    <span>内存使用率</span>
                    <span style={{ color: memoryUsed2 >= 85 ? "#f5222d" : memoryUsed2 < 50 ? "#52c41a" : memoryUsed2 !== undefined && "#fa8c16" }}>&nbsp;{memoryUsed2}&nbsp;%</span>
                </div>
                <Divider type="vertical" style={{ height: 30 }} />
                <div style={{ width: 140, display: "flex", justifyContent: "space-between" }}>
                    <span>CPU使用率</span>
                    <span style={{ color: cpuUsed >= 85 ? "#f5222d" : cpuUsed < 50 ? "#52c41a" : memoryUsed !== undefined && "#fa8c16" }}>&nbsp;{cpuUsed}&nbsp;%</span>
                </div>
            </div>
            :
            <div>
                <p style={{ textAlign: "center" }}>内存使用率</p>
                <Chart height={300} data={dv} scale={cols} padding="auto" forceFit>
                    <Coord type="theta" radius={0.5} />
                    <Tooltip showTitle={false} itemTpl="<li><span style=&quot;background-color:{color};&quot; class=&quot;g2-tooltip-marker&quot;></span>{name}: {value}</li>" />
                    <Geom type="intervalStack" position="percent" color="type" tooltip={['type*percent', (item, percent) => {
                        percent = `${(percent * 100).toFixed(2)}%`;
                        return {
                            name: item,
                            value: percent
                        };
                    }]} style={{
                        lineWidth: 1,
                        stroke: '#fff'
                    }} select={false}>
                        <Label content="type" offset={-10} />
                    </Geom>
                    <View data={dv1} scale={cols}>
                        <Coord type="theta" radius={0.75} innerRadius={0.5 / 0.75} />
                        <Geom type="intervalStack" position="percent" color={['name', ['#BAE7FF', '#7FC9FE', '#71E3E3', '#ABF5F5', '#8EE0A1', '#BAF5C4']]} tooltip={['name*percent', (item, percent) => {
                            percent = `${(percent * 100).toFixed(2)}%`;
                            return {
                                name: item,
                                value: percent
                            };
                        }]} style={{
                            lineWidth: 1,
                            stroke: '#fff'
                        }} select={false}>
                            <Label content="name" />
                        </Geom>
                    </View>
                    <Coord type="theta" radius={0.5} />
                    <Axis name="percent" />
                </Chart>
                <Divider />
                <p style={{ textAlign: "center" }}>CPU使用率</p>
                <Chart height={300} data={lineData} scale={cols1} forceFit padding="auto">
                    <Axis name="time" label={null} tickLine={null} />
                    <Axis name="value" title={true} />
                    <Tooltip crosshairs={{ type: "cross" }} shared={false} />
                    <Geom type="area" position="time*value" color="#81c5fd" />
                    <Geom type="line" position="time*value" size={2} />
                </Chart>
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "20px", fontSize: "12px" }}>
                    <span>过去60秒</span>
                    <span>40秒</span>
                    <span>20秒</span>
                    <span>0</span>
                </div>
            </div>
    };
};