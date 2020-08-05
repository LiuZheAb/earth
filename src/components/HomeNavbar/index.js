// 顶部导航栏部分
import React from 'react';
import { Link, withRouter } from "react-router-dom";
import { Layout, message, Modal } from 'antd';
import IconFont from '../../assets/IconFont';
import './index.css';
import { getCookie, removeCookie } from '../../utils/cookies';
import LoginModal from '../LoginModal';

const { Header } = Layout;

class HomeNavbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: getCookie("userName") ? getCookie("userName") : ""
        };
        this.handleClick = this.handleClick.bind(this);
    };
    handleClick() {
        message.warn('已注销', 1.5);
        sessionStorage.clear();
        removeCookie("userName")
        this.props.history.push("login");
    }
    showModal = () => {
        this.setState({ visible: true })
    }
    handleOk = e => {
        this.setState({ visible: false });
    };
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
                    <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false"/>
                    <span>综合地球物理联合反演与解释一体化平台</span>
                </Link>
                <div className="icon-area">
                    {userName ?
                        <>
                            <Link to="/personal" onClick={() => { sessionStorage.setItem("personalSiderKey", "1") }}>
                                <IconFont type="anticontouxiang" title="个人中心" />
                            </Link>
                            <IconFont className="quit-icon" type="anticonzhuxiaodenglu" title="注销" onClick={this.showConfirm} />
                        </>
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
                </div>
            </Header>
        );
    };
};

export default withRouter(HomeNavbar);