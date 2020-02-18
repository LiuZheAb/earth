// 前台内容区部分
import React from 'react';
import { Layout } from 'antd';
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import './index.css';
import loadable from '../../utils/lazyLoad';

const Home = loadable(() => import('../Home'));
const Hdfscluster = loadable(() => import('../HdfsCluster'));
const Bigdata = loadable(() => import('../Bigdata'));
const Yarncluster = loadable(() => import('../YarnCluster'));
const Hbasecluster = loadable(() => import('../HbaseCluster'));
const Zkui = loadable(() => import('../Zkui'));
const NewApp = loadable(() => import('../NewApp'));
const Personal = loadable(() => import('../Personal'));
const Notice = loadable(() => import('../Notice'));
const { Content } = Layout;

export default class Container extends React.Component {
    render() {
        return (
            <Content className="home-content" style={this.props.style}>
                <Route path="/home" component={Home} />
                <Route path="/hdfscluster" component={Hdfscluster} />
                <Route path="/bigdata" component={Bigdata} />
                <Route path="/yarncluster" component={Yarncluster} />
                <Route path="/hbasecluster" component={Hbasecluster} />
                <Route path="/zkui" component={Zkui} />
                <Route path="/newapp" component={NewApp} />
                <Route path="/personal" component={Personal} />
                <Route path="/notice" component={Notice} />
            </Content>
        );
    };
};