import React, { Component } from 'react';
import "./index.css";

export default class index extends Component {
    render() {
        return (
            <div className="jupyter-container">
                <iframe src="http://192.168.6.116:808/" frameBorder="0" title="jupyter" scrolling="no"></iframe>
            </div>
        )
    }
}
