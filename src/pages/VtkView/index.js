import React, { Component } from 'react';
import { Layout } from 'antd';
import IconFont from '../../assets/IconFont';
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import { createHashHistory } from 'history';
import './index.css';

const history = createHashHistory();

export default class VtkView extends Component {
    render() {
        return (
            <div className="vtkview">
                <header className="vtkview-header">
                    <Link to="/home">
                        <div className="vtkview-logo" title="综合地球物理联合反演与解释一体化平台">
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" />
                            <span>综合地球物理联合反演与解释一体化平台</span>
                        </div>
                    </Link>
                    <IconFont className="vtkview-quit" onClick={history.goBack} type="anticonfanhui" />
                </header>
                <div className="vtkview-content">
                    <iframe frameBorder="0" title="navigation" style={{ "width": "100%", "height": "100%" }} src="http://139.219.15.47:8080/"></iframe>
                </div >
            </div >
        )
    }
}
