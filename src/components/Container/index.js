// 前台内容区部分
import React from 'react';
import { Layout } from 'antd';
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import './index.css';
import loadable from '../../utils/lazyLoad';

const Home = loadable(() => import('../Home'));
const NewApp = loadable(() => import('../NewApp'));
const Personal = loadable(() => import('../Personal'));
const Notice = loadable(() => import('../Notice'));
const { Content } = Layout;

export default class Container extends React.Component {
    render() {
        return (
            <Content className="home-content" style={this.props.style}>
                <Route path="/home"><Home /></Route>
                <Route path="/newapp"><NewApp /></Route>
                <Route path="/personal"><Personal /></Route>
                <Route path="/notice"><Notice /></Route>
            </Content>
        );
    };
};