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
import apiPromise from '../../assets/url.js';

let api = "";

export default class Listener extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pieData: [],
            lineData: [],
            maxLineData: 5,
            minLineData: 0
        };
    };
    pieTimer = undefined;
    lineTimer = undefined;
    requestRef = undefined;
    componentDidMount() {
        this.getPieData();
        this.getLineData();
        apiPromise.then(res => api = res.data.api);
    }
    // 获取内存饼图数据
    getPieData = () => {
        const _this = this;
        this.pieTimer = window.setTimeout(() => {
            axios.get(api + 'monitor/memory')
                .then(function (response) {
                    _this.setState({
                        pieData: response.data,
                    },
                        () => {
                            let pieData = _this.state.pieData;
                            if (pieData[1].value < 50) {
                                pieData[1].value += 50
                                _this.setState({ pieData: pieData })
                            };
                            _this.getPieData();
                        });
                })
                .catch(function (error) {
                    message.error("服务器无响应", 2);
                });
        }, 1000);
    };
    // 获取CPU折线图数据
    getLineData = () => {
        const _this = this;
        this.requestRef = requestAnimationFrame(() => {
            this.lineTimer = window.setTimeout(() => {
                axios.get(api + 'monitor/cpu')
                    .then(function (response) {
                        let arr = [];
                        for (let i = 0; i < response.data.length; i++) {
                            arr.push(response.data[i].value);
                        };
                        let maxLineData = Math.max.apply(null, arr);
                        let minLineData = Math.min.apply(null, arr);
                        _this.setState({
                            lineData: response.data,
                            maxLineData: Math.ceil(maxLineData / 5) * 5,
                            minLineData: Math.floor(minLineData / 5) * 5
                        },
                            () => {
                                _this.getLineData();
                            }
                        )
                    })
                    .catch(function (error) {
                        message.error("服务器无响应", 2);
                    });
            }, 1000);
        });
    };
    // 页面注销时清空计时器
    componentWillUnmount() {
        clearInterval(this.pieTimer);
        clearInterval(this.lineTimer);
    };
    render() {
        const { DataView } = DataSet;
        const { pieData, lineData, minLineData, maxLineData } = this.state;
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
                min: minLineData,
                max: maxLineData
            },
            time: {
                range: [0, 1]
            },
            percent: {
                formatter: val => {
                    val = `${(val * 100).toFixed(2)}%`;
                    return val;
                }
            }
        };
        return (
            <div>
                <p style={{ textAlign: "center" }}>内存使用率</p>
                <Chart height={350} data={dv} scale={cols} padding="auto" forceFit>
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
                    <Axis name="value" />
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
        );
    };
};