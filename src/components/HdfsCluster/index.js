//前台HDFS应用iframe模块
import React from 'react';
import './index.css';
import Iframe from 'react-iframe';
import { bigdataUrl } from "../../assets/urls";

export default class Hdfscluster extends React.Component {
    componentDidMount() {
        document.title = "Hdfs集群";
    };
    render() {
        return (
            <div className="hdfscluster" style={{ width: '100%', height: '100%' }}>
                <Iframe
                    url={bigdataUrl + ":9870/explorer.html"}
                    className="hdfscluster-iframe"
                    scrolling="auto"
                />
            </div>
        );
    };
};