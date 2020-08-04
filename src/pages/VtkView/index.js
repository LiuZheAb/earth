import React, { Component } from 'react';
import IconFont from '../../assets/IconFont';
import { Link, withRouter } from "react-router-dom";
import { viewurl } from "../../assets/urls";
import './index.css';

class VtkView extends Component {
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
                    <IconFont className="vtkview-quit" onClick={this.props.history.goBack} type="anticonfanhui" />
                </header>
                <div className="vtkview-content">
                    <iframe frameBorder="0" title="navigation" style={{ "width": "100%", "height": "100%" }} src={viewurl}></iframe>
                </div >
            </div >
        )
    }
}

export default withRouter(VtkView);