import React from 'react';
import { Layout, Menu, Badge, List, Typography } from 'antd';
import "./index.css";

const { Sider, Content } = Layout;
const data = [
    '消息1,notice1.',
    '消息2,notice2.',
    '消息3,notice3.',
    '消息4,notice4.',
    '消息5,notice5.',
];

export default class Notice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            siderKey: sessionStorage.getItem("noticeSiderKey") ? sessionStorage.getItem("noticeSiderKey") : "1",
        };
        this.changeSider = this.changeSider.bind(this);
    };
    changeSider(props) {
        this.setState({
            siderKey: props.key
        });
        sessionStorage.setItem("noticeSiderKey", props.key);
    };
    render() {
        const { siderKey } = this.state;
        let content;
        switch (siderKey) {
            case "1":
                content = <div>无</div>;
                break;
            case "2":
                content = <List
                    bordered
                    dataSource={data}
                    renderItem={item => (
                        <List.Item>
                            <Typography.Text mark>[NOTICE]</Typography.Text> {item}
                        </List.Item>
                    )}
                />;
                break;
            case "3":
                content = <div>无</div>;
                break;
            default:
                break;
        };
        return (
            <Layout className="notice box-shadow">
                <Sider className="notice-sider">
                    <Menu
                        theme="light"
                        mode="inline"
                        defaultSelectedKeys={[siderKey]}
                        style={{ lineHeight: '64px' }}
                        id="notice-menu"
                    >
                        <Menu.Item key="1" onClick={this.changeSider}>已读消息</Menu.Item>
                        <Menu.Item key="2" onClick={this.changeSider}><Badge count={5} overflowCount={10} offset={[15, 0]}>未读消息</Badge></Menu.Item>
                        <Menu.Item key="3" onClick={this.changeSider}>系统通知</Menu.Item>
                    </Menu>
                </Sider>
                <Content className="notice-content">
                    {content}
                </Content>
            </Layout>
        );
    };
};