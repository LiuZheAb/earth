/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 最近访问组件
 */

import React from "react";
import axios from 'axios';
import { Link } from "react-router-dom";
import { Input, Row, Col, message, Drawer, Result, Modal } from "antd";
import IconFont from '../IconFont';
import apiPromise from '../../assets/url.js';
import loadable from '../../utils/lazyLoad';
import { getCookie } from '../../utils/cookies';
import "./index.css";

let api = "";
const LoginModal = loadable(() => import('../LoginModal'));

export default class RecentVisit extends React.Component {
    state = {
        userName: getCookie("userName") ? getCookie("userName") : "",
        recentVisit: [],
        searchResult: "",
        visible: false
    };
    componentDidMount() {
        apiPromise.then(res => {
            api = res.data.api;
            if (this.state.userName) {
                axios.get(api + "recentvisit", {
                    params: {
                        userName: this.state.userName,
                    }
                }).then(response => {
                    this.setState({
                        recentVisit: response.data.message
                    })
                }).catch(error => {
                    message.error("服务器无响应", 2)
                });
            };
        });
    };
    // 点击应用将其名称保存到sessionStotage中
    setApp(appName) {
        sessionStorage.setItem("appName", appName);
    };
    // 搜索应用
    searchApp(appName) {
        if (appName) {
            axios({
                method: 'post',
                url: api + 'search',
                responseType: 'json',
                data: {
                    projectName: appName
                },
                headers: { 'Content-Type': 'application/json' },
            }).then(response => {
                this.setState({
                    searchResult: response.data.message,
                    visible: true
                });
            }).catch(error => {
                message.error("服务器无响应", 2);
            });
        } else {
            message.warning("请输入要搜索的内容");
        };
    };
    // 显示搜索结果抽屉
    showDrawer = () => {
        this.setState({
            visible: true,
        });
    };
    // 关闭搜索结果抽屉
    onClose = () => {
        this.setState({
            visible: false,
        });
    };
    // 点击确认调用
    handleOk = e => {
        this.setState({
            visible2: false,
        });
    };
    render() {
        let { visible, searchResult, userName, recentVisit } = this.state;
        return (
            <Col lg={12} xs={24} style={{ display: "flex", alignItems: "stretch", marginTop: 10 }}>
                <div className="search-area box-shadow" style={{ position: 'relative', width: "100%", height: "100%" }}>
                    {/* <div className="searcher" >
                        <Input.Search
                            className="search-box"
                            placeholder="请输入关键词"
                            onSearch={this.searchApp.bind(this)}
                        />
                    </div> */}
                    <Drawer
                        placement="right"
                        closable={false}
                        onClose={this.onClose}
                        visible={visible}
                        getContainer={false}
                        style={{ position: 'absolute' }}
                        bodyStyle={{ height: "100%" }}
                        width="calc(50% - 5px)"
                    >
                        <IconFont type="earthbaseline-close-px" onClick={this.onClose} style={{ float: "right", margin: "-10px", color: "#1890ff" }}></IconFont>
                        {typeof (searchResult) === "string" ?
                            <Result
                                status="warning"
                                title="查询不到相关应用"
                            />
                            :
                            <>
                                已为您匹配最佳结果
                        <hr style={{ margin: "5px" }} />
                                <Row className="recent-visit" gutter={10}>
                                    {searchResult.map((app, appIndex) => {
                                        return (
                                            <Col span={8} key={appIndex}>
                                                {/* <Link to="/calculate" onClick={this.setApp.bind(this, app)}><p className="app-name">{app}</p></Link> */}
                                                <span><p className="app-name">{app}</p></span>
                                            </Col>
                                        )
                                    })}
                                </Row>
                            </>
                        }
                    </Drawer>
                    <div className="recent-visit app">
                        <div className="app-icon">
                            <IconFont type="earthzuijinfangwen" />
                        </div>
                        <div className="app-des">
                            <p className="title">最近访问</p>
                            {userName && recentVisit ?
                                <div className="recent-visit-list">
                                    <ul>
                                        {recentVisit.map((app, appIndex) => {
                                            return (
                                                <li className="recent-visit-item" key={appIndex}>
                                                    {/* <IconFont className="icon-link" type="earthlianjie" />
                                                <Link to="/calculate" onClick={this.setApp.bind(this, app)} title={app}>{app}</Link> */}
                                                    <IconFont type="earthjinru1" />
                                                    <span title={app}>{app}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                                : <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100% - 32px)" }}>
                                    <Link to="/login">您还未登录，请先登录</Link>
                                </div>
                            }
                            <Modal
                                visible={this.state.visible2}
                                onOk={this.handleOk}
                                onCancel={this.handleOk}
                                footer={null}
                                bodyStyle={{ padding: "40px 40px 20px" }}
                                style={{ width: "300px", maxWidth: "500px" }}>
                                <LoginModal parent={this} />
                            </Modal>
                        </div>
                    </div>
                </div>
            </Col>
        );
    };
};