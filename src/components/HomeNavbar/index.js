/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 顶部导航栏部分
 */

import React from 'react';
import { Layout, message, Modal } from 'antd';
import { Link, withRouter } from "react-router-dom";
import LoginModal from '../LoginModal';
import IconFont from '../IconFont';
import { getCookie, removeCookie } from '../../utils/cookies';
import './index.css';

const { Header } = Layout;

class HomeNavbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: getCookie("userName") ? getCookie("userName") : ""
        };
        this.handleClick = this.handleClick.bind(this);
    };
    // 注销
    handleClick() {
        message.warn('已注销', 1.5);
        sessionStorage.clear();
        removeCookie("userName")
        this.props.history.push("login");
    }
    // 显示登陆模态框
    showModal = () => {
        this.setState({ visible: true })
    }
    // 点击确定调用
    handleOk = e => {
        this.setState({ visible: false });
    };
    // 注销时确认对话框
    showConfirm = () => {
        let _this = this;
        Modal.confirm({
            title: '确定注销吗?',
            onOk() {
                _this.handleClick();
            },
            onCancel() {
            },
            okText: "确定",
            cancelText: "取消"
        });
    }
    render() {
        let { userName, visible } = this.state;
        return (
            <Header className="home-header" role="navigation" style={this.props.style}>
                <Link to="/home" className="logo" title="综合地球物理联合反演与解释一体化平台">
                    <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" />
                    <span>综合地球物理联合反演与解释一体化平台</span>
                </Link>
                {userName ?
                    <div className="icon-area">
                        <Link to="/personal" onClick={() => { sessionStorage.setItem("personalSiderKey", "1") }}>
                            <IconFont type="earthtouxiang" title="个人中心" />
                        </Link>
                        <IconFont className="quit-icon" type="earthzhuxiaodenglu" title="注销" onClick={this.showConfirm} />
                    </div>
                    :
                    <span style={{ color: "#1890ff", cursor: "pointer" }} onClick={this.showModal}>登录</span>
                }
                <Modal
                    visible={visible}
                    onOk={this.handleOk}
                    onCancel={this.handleOk}
                    footer={null}
                    bodyStyle={{ padding: "40px 40px 20px" }}
                    style={{ width: "300px", maxWidth: "500px" }}>
                    <LoginModal parent={this} />
                </Modal>
            </Header>
        );
    };
};

export default withRouter(HomeNavbar);