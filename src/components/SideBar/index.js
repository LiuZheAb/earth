//侧边栏
import React from 'react';
import { Menu, Icon, Layout, message } from 'antd';
import { Link, withRouter } from "react-router-dom";
import './index.css';
import IconFont from '../../assets/IconFont';
import { getCookie } from "../../utils/cookies";

const { Sider } = Layout;

class Sidebar extends React.Component {
    state = {
        //侧边栏默认收缩
        collapsed: true,
    };
    //鼠标移入侧边栏展开
    MouseOver = () => {
        this.setState({
            collapsed: false,
        });
    };
    //鼠标移入侧边栏收缩
    MouseLeave = () => {
        this.setState({
            collapsed: true,
        });
    };
    //锚点效果，点击“应用与服务”时调用
    scrollToAnchor = (anchorName) => {
        if (anchorName) {
            // 找到锚点
            let anchorElement = document.getElementById(anchorName);
            // 如果对应id的锚点存在，就跳转到锚点
            if (anchorElement) {
                anchorElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
            } else {
                this.props.history.push('home');
            };
        };
    };
    handleClick() {
        if (getCookie("userName")) {
            this.props.history.push('newapp');
        } else {
            message.error("请先登录", 2);
        };
    };
    render() {
        return (
            <Sider
                className="home-sidebar"
                trigger={null}
                collapsible
                collapsed={this.state.collapsed}
                onMouseOver={this.MouseOver}
                onMouseLeave={this.MouseLeave}
                style={this.props.style}
            >
                <Menu
                    theme="light"
                    mode="inline"
                >
                    <Menu.Item key="1" >
                        <Link to="/home">
                            <Icon type="appstore" theme="filled" style={{ fontSize: '18px' }} />
                            <span>应用与服务</span>
                        </Link>
                    </Menu.Item>
                    <Menu.Item key="2" onClick={this.handleClick.bind(this)}>
                        <IconFont type="anticonxinjianxiangmu" style={{ fontSize: '18px' }} />
                        <span>新建应用</span>
                    </Menu.Item>
                    <Menu.Item key="3">
                        <Link to="/datarender">
                            <IconFont type="anticonfl-shuazi" style={{ fontSize: '18px' }} />
                            <span>数据渲染</span>
                        </Link>
                    </Menu.Item>
                </Menu>
            </Sider>
        );
    };
};

export default withRouter(Sidebar);