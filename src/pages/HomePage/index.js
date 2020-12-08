/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 前台首页
 */

import React from 'react';
import axios from 'axios';
import { Layout, BackTop, Alert, message } from 'antd';
import HomeNavbar from '../../components/HomeNavbar';
import Sidebar from '../../components/SideBar';
import Container from '../../components/Container';
import apiPromise from '../../assets/url.js';

let api = "";

export default class Homepage extends React.Component {
    state = {
        invisible: true
    };
    // 关闭顶部提示栏
    handleClose() {
        this.setState({
            invisible: true
        });
    };
    componentDidMount() {
        const _this = this;
        apiPromise.then(res => {
            api = res.data.api;
            axios.get(api)
                .then(function (response) {
                    _this.setState({
                        invisible: true
                    });
                })
                .catch(function (error) {
                    _this.setState({
                        invisible: false
                    });
                    message.error("服务器无响应", 2);
                });
        });
    };
    render() {
        const { invisible } = this.state;
        return (
            <Layout>
                {invisible ? (
                    null
                ) : <Alert
                        message="服务器无响应，请刷新重试"
                        type="error"
                        closable
                        afterClose={this.handleClose.bind(this)}
                        style={invisible ? {} : { position: "fixed", top: "0", width: "100%", zIndex: "9" }}
                        banner
                    />}
                <HomeNavbar style={invisible ? {} : { position: "fixed", top: "37px" }} />
                <Sidebar style={invisible ? {} : { position: "fixed", top: "87px" }} />
                <Container style={invisible ? { marginTop: "49px" } : { marginTop: "87px" }} />
                <BackTop />
            </Layout>
        );
    };
};