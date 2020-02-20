import React from 'react';
import { Switch, Redirect, HashRouter as Router, Route } from "react-router-dom";
import loadable from '../utils/lazyLoad';

const Homepage = loadable(() => import('../pages/HomePage'));
const LoginRegister = loadable(() => import('../pages/LoginRegister'));
const Details = loadable(() => import('../pages/Details'));
const ErrorPage = loadable(() => import('../pages/ErrorPage'));
const About = loadable(() => import('../pages/About'));
const VtkView = loadable(() => import('../pages/VtkView'));

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
                    <Route exact path="/vtkview">
                        <VtkView />
                    </Route>
                    <Route exact path="/">
                        <Redirect to="/login" />
                    </Route>
                    <Route path={["/login", "/register"]} component={LoginRegister} />
                    <Route path="/about" component={About} />
                    <Route render={() => (<ErrorPage />)} />
                </Switch>
            </Router>
        );
    };
};
