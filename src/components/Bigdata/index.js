//前台数据存储应用iframe模块
import React from 'react';
import './index.css';
import Iframe from 'react-iframe';
import { bigdataUrl2 } from "../../assets/urls";

export default class Bigdata extends React.Component {
    componentDidMount() {
        document.title = "集群上传下载";
    };
    render() {
        return (
            <div className="bigdata" style={{ width: '100%', height: '100%' }}>
                <Iframe
                    url={bigdataUrl2 + ":7373"}
                    className="bigdata-iframe"
                    scrolling="auto"
                />
            </div>
        );
    };
};