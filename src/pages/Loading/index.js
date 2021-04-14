import React, { Component } from 'react';
import { Spin } from "antd";

export default class index extends Component {
    render() {
        return (
            <div style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin size="large" tip="应用启动中... ..." style={{ lineHeight: 3, fontSize: 18 }}></Spin>
            </div>
        )
    }
}
