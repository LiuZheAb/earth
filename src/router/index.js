/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 路由管理文件
 */

import React from 'react';
import { Switch, Redirect, HashRouter as Router, Route } from "react-router-dom";
import loadable from '../utils/lazyLoad';

const Homepage = loadable(() => import('../pages/HomePage'));
const LoginRegister = loadable(() => import('../pages/LoginRegister'));
const Details = loadable(() => import('../pages/Details'));
const ErrorPage = loadable(() => import('../pages/ErrorPage'));
const About = loadable(() => import('../pages/About'));
const Test = loadable(() => import('../pages/Test'));

export default class EarthRouter extends React.Component {
    render() {
        return (
            <Router>
                <Switch>
                    <Route path={["/home", "/console", "/newapp", "/personal", "/datarender"]}>
                        <Homepage />
                    </Route>
                    <Route exact path="/details">
                        <Details />
                    </Route>
                    <Route exact path="/test">
                        <Test />
                    </Route>
                    <Route exact path="/">
                        <Redirect to="/home" />
                    </Route>
                    <Route path={["/login", "/register"]} component={LoginRegister} />
                    <Route path="/about" component={About} />
                    <Route render={() => (<ErrorPage />)} />
                </Switch>
            </Router>
        );
    };
};
