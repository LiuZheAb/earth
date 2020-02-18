import React from 'react';
import { Switch, Redirect, HashRouter as Router, Route } from "react-router-dom";
import loadable from '../utils/lazyLoad';

const Homepage = loadable(() => import('../pages/HomePage'));
const Login = loadable(() => import('../pages/Login'));
const Register = loadable(() => import('../pages/Register'));
const Details = loadable(() => import('../pages/Details'));
const ErrorPage = loadable(() => import('../pages/ErrorPage'));
const About = loadable(() => import('../pages/About'));


export default class EarthRouter extends React.Component {
    render() {
        return (
            <Router>
                <Switch>
                    <Route path={["/home", "/hdfscluster", "/bigdata", "/yarncluster", "/hbasecluster", "/zkui", "/newapp", "/personal", "/notice"]}>
                        <Homepage />
                    </Route>
                    <Route exact path="/details">
                        <Details />
                    </Route>
                    <Route exact path="/">
                        <Redirect to="/login" />
                    </Route>
                    <Route path="/login"><Login /></Route>
                    <Route path="/register"><Register /></Route>
                    <Route path="/about"><About /></Route>
                    <Route render={() => (<ErrorPage />)} />
                </Switch>
            </Router>
        );
    };
};
