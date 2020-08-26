/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 关于我们页面
 */

import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, withRouter } from "react-router-dom";
import IconFont from '../../components/IconFont';
import "./index.css";

const { Header, Sider, Content } = Layout;

class About extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            aboutSiderKey: sessionStorage.getItem("aboutSiderKey") ? sessionStorage.getItem("aboutSiderKey") : "1",
        };
    };
    // 点击侧边栏调用
    changeSider = ({ key }) => {
        this.setState({
            aboutSiderKey: key
        });
    };
    render() {
        const { aboutSiderKey } = this.state;
        sessionStorage.setItem("aboutSiderKey", aboutSiderKey);
        let content;
        switch (aboutSiderKey) {
            case "1":
                content =
                    <>
                        <img src={require('../../assets/images/about.png')} alt="关于我们" />
                        <p style={{ textIndent: "2em" }}>项目拟通过3000米以浅多种、多类型数据的联合反演解释技术以及多元信息评价与预测技术，发展大数据人工智能理论方法，提高大规模数据处理、解释的高性能计算能力，研发重磁、电磁、地震处理、解释可视化及一体化平台，开展典型矿集区应用示范，从而实现中深部金属矿产资源评价与预测。</p>
                    </>;
                break;
            case "2":
                content = <p>软件平台说明书</p>;
                break;
            case "3":
                content = <p>用户协议</p>;
                break;
            case "4":
                content = <p>法律声明及隐私权政策</p>;
                break;
            case "5":
                content = <div>
                    <p>姓名：王彦飞</p>
                    <p>职称：研究员</p>
                    <p>学位：博士</p>
                    <p>电话：010-82998132</p>
                    <p>邮箱：yfwang@mail.iggcas.ac.cn</p>
                    <p>传真：010-62010846</p>
                    <p>邮编：100029</p>
                    <p>地质：北京市朝阳区北土城西路19号，中科院地质与地球物理研究所</p>
                </div>
                break;
            default:
                break;
        }
        return (
            <Layout className="about">
                <Header className="about-header">
                    <Link to="/home" className="about-logo" title="综合地球物理联合反演与解释一体化平台">
                        <img src={require("../../assets/images/logo.png")} alt="IPIG" flowgable="false" />
                        <span>综合地球物理联合反演与解释一体化平台</span>
                    </Link>
                    <IconFont className="about-quit" onClick={this.props.history.goBack} type="earthfanhui" title="返回上一页" />
                </Header>
                <Layout className="about-contentarea">
                    <Sider className="about-sider">
                        <Menu
                            className="about-menu-v"
                            theme="light"
                            mode="vertical"
                            defaultSelectedKeys={[aboutSiderKey]}
                            style={{ lineHeight: '64px', marginTop: "20px" }}
                        >
                            <Menu.Item key="1" onClick={this.changeSider}>关于我们</Menu.Item>
                            <Menu.Item key="2" onClick={this.changeSider}>软件平台说明书</Menu.Item>
                            <Menu.Item key="3" onClick={this.changeSider}>用户协议</Menu.Item>
                            <Menu.Item key="4" onClick={this.changeSider}>法律声明及隐私权政策</Menu.Item>
                            <Menu.Item key="5" onClick={this.changeSider}>联系我们</Menu.Item>
                        </Menu>
                    </Sider>
                    <Content className="about-content">
                        <div className="about-container box-shadow">
                            <Menu
                                className="about-menu-h"
                                theme="light"
                                mode="horizontal"
                                defaultSelectedKeys={[aboutSiderKey]}
                            >
                                <Menu.Item key="1" onClick={this.changeSider}>关于我们</Menu.Item>
                                <Menu.Item key="2" onClick={this.changeSider}>软件平台说明书</Menu.Item>
                                <Menu.Item key="3" onClick={this.changeSider}>用户协议</Menu.Item>
                                <Menu.Item key="4" onClick={this.changeSider}>法律声明及隐私权政策</Menu.Item>
                                <Menu.Item key="5" onClick={this.changeSider}>联系我们</Menu.Item>
                            </Menu>
                            <div className="textarea">{content}</div>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        );
    };
};

export default withRouter(About);