//前台Zkui应用iframe模块
import React from 'react';
import './index.css';
import Iframe from 'react-iframe';
import { bigdataUrl } from '../../assets/urls';

export default class Zkui extends React.Component {
    componentDidMount() {
        document.title = "Zookeeper";
    };
    render() {
        return (
            <div className="zkui" style={{ width: '100%', height: '100%' }}>
                <Iframe
                    url={bigdataUrl + ":9090/login"}
                    className="zkui-iframe"
                    scrolling="auto"
                />
            </div>
        );
    };
};