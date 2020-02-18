//前台Yarncluster应用iframe模块
import React from 'react';
import './index.css';
import Iframe from 'react-iframe';
import { bigdataUrl } from "../../assets/urls";

export default class Yarncluster extends React.Component {
    componentDidMount() {
        document.title = "Yarn集群";
    };
    render() {
        return (
            <div className="yarncluster" style={{ width: '100%', height: '100%' }}>
                <Iframe
                    url={bigdataUrl + ":8088/cluster"}
                    className="yarncluster-iframe"
                    scrolling="auto"
                />
            </div>
        );
    };
};