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
import IconFont from '../../assets/IconFont';
import { apiurl } from '../../assets/url.js';
import loadable from '../../utils/lazyLoad';
import { getCookie } from '../../utils/cookies';
import "./index.css";

const LoginModal = loadable(() => import('../LoginModal'));

export default class RecentVisit extends React.Component {
    state = {
        userName: getCookie("userName") ? getCookie("userName") : "",
        recentVisit: [],
        searchResult: "",
        visible: false
    };
    componentDidMount() {
        const _this = this;
        if (this.state.userName) {
            axios.get(apiurl + "recentvisit", {
                params: {
                    userName: _this.state.userName,
                }
            }).then(function (response) {
                _this.setState({
                    recentVisit: response.data.message
                })
            }).catch(function (error) {
                message.error("服务器无响应", 2)
            });
        };
    };
    // 点击应用将其名称保存到sessionStotage中
    setApp(appName) {
        sessionStorage.setItem("appName", appName);
    };
    // 搜索应用
    searchApp(appName) {
        const _this = this;
        if (appName) {
            axios({
                method: 'post',
                url: apiurl + 'search',
                responseType: 'json',
                data: {
                    projectName: appName
                },
                headers: { 'Content-Type': 'application/json' },
            })
                .then(function (response) {
                    _this.setState({
                        searchResult: response.data.message,
                        visible: true
                    });
                })
                .catch(function (error) {
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
            <div className="search-area box-shadow" style={{ position: 'relative', }}>
                <div className="searcher" >
                    <Input.Search
                        className="search-box"
                        placeholder="请输入关键词"
                        onSearch={this.searchApp.bind(this)}
                    />
                </div>
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
                    <IconFont type="earthbaseline-close-px" onClick={this.onClose} style={{ float: "right", margin: "-10px" }}></IconFont>
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
                                            <Link to="/details" onClick={this.setApp.bind(this, app)}><p className="app-name">{app}</p></Link>
                                        </Col>
                                    )
                                })}
                            </Row>
                        </>
                    }
                </Drawer>
                {userName ?
                    <div className="recent-visit">
                        <p className="title">最近访问</p>
                        {recentVisit ?
                            <div className="recent-visit-list">
                                {recentVisit.map((app, appIndex) => {
                                    return (
                                        <div className="recent-visit-item" key={appIndex}>
                                            <IconFont className="icon-link" type="earthlianjie" />
                                            <Link to="/details" onClick={this.setApp.bind(this, app)} title={app}>{app}</Link>
                                        </div>
                                    )
                                })}
                            </div>
                            : null}
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
                    : null}
            </div>
        );
    };
};