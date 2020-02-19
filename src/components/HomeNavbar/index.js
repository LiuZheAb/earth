// 顶部导航栏部分
import React from 'react';
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import { Layout, Menu, Dropdown, message, Badge, Modal } from 'antd';
import IconFont from '../../assets/IconFont';
import { createHashHistory } from 'history';
import './index.css';
import { getCookie, removeCookie } from '../../utils/cookies';
import LoginModal from '../LoginModal';

const { Header } = Layout;
const history = createHashHistory();

export default class HomeNavbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: getCookie("userName") ? getCookie("userName") : ""
        };
        this.handleClick = this.handleClick.bind(this);
    };
    handleClick(props) {
        switch (props.key) {
            case "1":
                break;
            case "2":
                sessionStorage.setItem("personalSiderKey", "1");
                history.push("personal");
                break;
            case "3":
                message.warn('即将退出', 1.5)
                setTimeout(() => {
                    sessionStorage.clear();
                    removeCookie("userName")
                    history.push("login");
                }, 1500);
                break;
            default:
                break;
        };
    }
    showModal = () => {
        this.setState({ visible: true })
    }
    handleOk = e => {
        this.setState({ visible: false });
    };
    render() {
        const menu = <Menu>
            <Menu.Item key="1" onClick={this.handleClick}>系统设置</Menu.Item>
            <Menu.Item key="2" onClick={this.handleClick}>个人设置</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3" onClick={this.handleClick}>注销</Menu.Item>
        </Menu>;
        return (
            <Header className="home-header" role="navigation" style={this.props.style}>
                <div className="leftdiv">
                    <Link to="/home">
                        <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" style={{ marginRight: '10px', height: "24px" }} />
                        <span>综合地球物理联合反演与解释一体化平台</span>
                    </Link>
                </div>
                <div className="rightdiv">
                    <div className="dropdown">
                        {this.state.userName ?
                            <>
                                <div>
                                    <Link to="/personal" onClick={() => { sessionStorage.setItem("personalSiderKey", "1") }}>
                                        <IconFont type="anticontouxiang" title="个人中心" style={{ fontSize: '24px', color: 'rgb(50,148,221)' }} />
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/notice" onClick={() => { sessionStorage.setItem("noticeSiderKey", "1") }}>
                                        <Badge count={5} overflowCount={10}>
                                            <IconFont type="anticontongzhi" title="通知中心" style={{ fontSize: '24px', color: 'rgb(50,148,221)' }} />
                                        </Badge>
                                    </Link>
                                </div>
                                <div>
                                    <Dropdown overlay={menu}>
                                        <IconFont type="anticonshezhi1" title="设置" style={{ fontSize: '24px', color: 'rgb(50,148,221)' }} />
                                    </Dropdown>
                                </div>
                            </>
                            :
                            <span style={{ color: "#1890ff", cursor: "pointer" }} onClick={this.showModal}>请先登录</span>
                        }
                        <Modal
                            visible={this.state.visible}
                            onOk={this.handleOk}
                            onCancel={this.handleOk}
                            footer={null}
                            bodyStyle={{ padding: "40px 40px 20px" }}
                            style={{ width: "300px", maxWidth: "500px" }}>
                            <LoginModal parent={this} />
                        </Modal>
                    </div>
                </div>
            </Header>
        );
    };
};