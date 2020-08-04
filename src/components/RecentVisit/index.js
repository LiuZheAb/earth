import React from "react";
import { Input, Row, Col, message, Drawer, Result, Modal } from "antd";
import { Link } from "react-router-dom";
import IconFont from '../../assets/IconFont';
import axios from 'axios';
import { apiurl } from '../../assets/urls';
import { getCookie } from '../../utils/cookies';
import loadable from '../../utils/lazyLoad';
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
    setApp(appName) {
        sessionStorage.setItem("appName", appName);
    };
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
    showDrawer = () => {
        this.setState({
            visible: true,
        });
    };
    onClose = () => {
        this.setState({
            visible: false,
        });
    };
    showModal = () => {
        this.setState({ visible2: true })
    }
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
                        placeholder="请输入关键词"
                        style={{ width: "50%", minWidth: "150px", height: 30 }}
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
                    <IconFont type="anticonbaseline-close-px" onClick={this.onClose} style={{ float: "right", margin: "-10px" }}></IconFont>
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
                <p>最近访问</p>
                {userName ?
                    (recentVisit ? <div className="recent-visit" gutter={10}>
                        {recentVisit.map((app, appIndex) => {
                            return (
                                <span key={appIndex}>
                                    <Link to="/details" onClick={this.setApp.bind(this, app)}><p className="app-name">{app}</p></Link>
                                </span>
                            )
                        })}
                    </div> : null)
                    : <span style={{ color: "#1890ff", cursor: "pointer" }} onClick={this.showModal}>您还未登录，请先登录</span>
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
        );
    };
};