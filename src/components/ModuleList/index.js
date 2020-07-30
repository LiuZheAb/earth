//首页应用列表
import React from 'react';
import { Row, Col, Result, Spin } from 'antd';
import { apiurl } from '../../assets/urls';
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import axios from 'axios';
import './index.css';
import IconFont from '../../assets/IconFont';

export default class ModuleList extends React.Component {
    state = {
        modules: [],
        appList: [],
        dataTab: 2,
        appIndex: 0,
        loading: "loading"
    };
    componentDidMount() {
        const _this = this;
        //获取模块名和应用列表数组
        axios.get(apiurl + 'home')
            .then(function (response) {
                let appList = Object.values(response.data);
                appList = [[appList[0], appList[1]], [appList[2], appList[3]], [appList[4], appList[5]]];
                _this.setState({
                    modules: Object.keys(response.data),
                    appList: appList,
                    loading: "done"
                });
            })
            .catch(function (error) {
                _this.setState({
                    loading: "error"
                });
            });
    };
    //点击应用时将所点的应用名称保存到sessionStorage中
    setApp(appName) {
        sessionStorage.setItem("appName", appName);
    };
    render() {
        const { appList, modules, loading } = this.state;
        function type(index) {
            switch (index) {
                case 0:
                    return "anticondatabase";
                case 1:
                    return "anticonrelitu";
                case 2:
                    return "anticonIconfont_field";
                case 3:
                    return "anticonmagneton";
                case 4:
                    return "anticoncomputer1";
                case 5:
                    return "anticonAIzhineng";
                default:
                    break;
            };
        };
        return (
            <div id="app-service-anchor">
                {loading === "loading" ?
                    <div style={{ width: "100%", height: "400px", lineHeight: "400px", textAlign: "center" }}>
                        <Spin tip="应用列表加载中，请稍候..." />
                    </div>
                    :
                    loading === "done" ? 
                    appList.map((apps, index) => {
                        return (
                            <Row gutter={10} key={index} className="app-row">
                                <Col span={12}>
                                    <div className="box-shadow app">
                                        <div className="app-icon">
                                            <IconFont type={type(index * 2)} />
                                        </div>
                                        <div className="app-des">
                                            <p className="module-name">{modules[index * 2]}</p>
                                            <div className="app-list">
                                                <Row gutter={10}>
                                                    {apps[0].map((app, appIndex) => {
                                                        return (
                                                            <Col span={6} key={appIndex} style={{ marginBottom: "10px" }}>
                                                                <Link to="/details" onClick={this.setApp.bind(this, app)}><p className="app-name">{app}</p></Link>
                                                            </Col>
                                                        )
                                                    })}
                                                </Row>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div className="box-shadow app">
                                        <div className="app-icon">
                                            <IconFont type={type(index * 2 + 1)} />
                                        </div>
                                        <div className="app-des">
                                            <p className="module-name">{modules[index * 2 + 1]}</p>
                                            <div className="app-list">
                                                <Row gutter={10}>
                                                    {apps[1].map((app, appIndex) => {
                                                        return (
                                                            <Col span={6} key={appIndex} style={{ marginBottom: "10px" }}>
                                                                {/* <Link to="/magneton" onClick={this.setApp.bind(this, app)}><p className="app-name">{app}</p></Link> */}
                                                                <Link to="/details" onClick={this.setApp.bind(this, app)}><p className="app-name">{app}</p></Link>
                                                            </Col>
                                                        )
                                                    })}
                                                </Row>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        )
                    })
                        :
                        <Result
                            status="warning"
                            title="服务器错误,无法获取应用列表,请尝试刷新或联系管理员"
                        />
                }
            </div>
        );
    };
};