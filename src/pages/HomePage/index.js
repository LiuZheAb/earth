//前台首页
import React from 'react';
import HomeNavbar from '../../components/HomeNavbar';
import Sidebar from '../../components/SideBar';
import Container from '../../components/Container';
import { Layout, BackTop, Alert, message } from 'antd';
import { apiurl } from '../../assets/urls';
import axios from 'axios';

export default class Homepage extends React.Component {
    state = {
        invisible: true
    };
    handleClose() {
        this.setState({
            invisible: true
        });
    };
    componentDidMount() {
        const _this = this;
        axios.get(apiurl)
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