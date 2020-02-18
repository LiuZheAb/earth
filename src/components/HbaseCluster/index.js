//前台Hbase应用iframe模块
import React from 'react';
import './index.css';
import Iframe from 'react-iframe';
import { bigdataUrl } from "../../assets/urls";

export default class Hbasecluster extends React.Component {
    componentDidMount() {
        document.title = "Hbase集群";
    };
    render() {
        return (
            <div className="hbasecluster" style={{ width: '100%', height: '100%' }}>
                <Iframe
                    url={bigdataUrl + ":16010"}
                    className="hbasecluster-iframe"
                    scrolling="auto"
                />
            </div>
        );
    };
};