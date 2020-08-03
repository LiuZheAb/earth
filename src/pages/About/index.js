import React from 'react';
import { Layout, Menu } from 'antd';
import IconFont from '../../assets/IconFont';
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import { createHashHistory } from "history";
import "./index.css";

const history = createHashHistory();
const { Header, Sider, Content } = Layout;

export default class About extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            aboutSiderKey: sessionStorage.getItem("aboutSiderKey") ? sessionStorage.getItem("aboutSiderKey") : "1",
        };
    };
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
                        <img src={require('../../assets/images/about.png')} alt="关于我们" style={{ width: "100%", marginBottom: "20px" }} />
                        <p>关于我们</p>
                        <p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p><p>关于我们</p>
                    </>;
                break;
            case "2":
                content = <p>立即加入</p>;
                break;
            case "3":
                content = <p>用户协议</p>;
                break;
            case "4":
                content = <p>法律声明及隐私权政策</p>;
                break;
            case "5":
                content = <p>联系我们</p>;
                break;
            default:
                break;
        }
        return (
            <Layout className="about">
                <Header className="about-header">
                    <Link to="/login">
                        <div className="about-logo" title="综合地球物理联合反演与解释一体化平台">
                            <img src={require("../../assets/images/logo.png")} alt="IPIG" flowgable="false" />
                            <span>综合地球物理联合反演与解释一体化平台</span>
                        </div>
                    </Link>
                    <IconFont className="about-quit" onClick={history.goBack} type="anticonfanhui" title="返回上一页" />
                </Header>
                <Layout className="about-contentarea">
                    <Sider className="about-sider">
                        <Menu
                            theme="light"
                            mode="inline"
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
                            <div className="textarea">{content}</div>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        );
    };
};