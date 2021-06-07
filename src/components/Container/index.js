/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 前台内容区部分
 */

import React from 'react';
import { Layout } from 'antd';
import { Route } from "react-router-dom";
import loadable from '../../utils/lazyLoad';
import './index.css';

const Home = loadable(() => import('../Home'));
const Console = loadable(() => import('../Console'));
const NewApp = loadable(() => import('../NewApp'));
const Personal = loadable(() => import('../Personal'));
const Demos = loadable(() => import('../Demos'));
const { Content } = Layout;

export default class Container extends React.Component {
    render() {
        return (
            <Content className="home-content" style={this.props.style}>
                <Route exact path="/home"><Home /></Route>
                <Route exact path={["/console", "/console/:p"]}><Console /></Route>
                <Route exact path="/newapp"><NewApp /></Route>
                <Route exact path="/personal"><Personal /></Route>
                <Route exact path="/demos"><Demos /></Route>
            </Content>
        );
    };
};