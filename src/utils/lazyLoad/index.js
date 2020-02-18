import React from 'react';
import { Spin } from 'antd';
import Loadable from 'react-loadable';

let style = {
    textAlign: "center",
    background: "rgba(0, 0, 0, 0.05)",
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "fixed",
    left: 0,
    top: 0
};
const loadingComponent = () => {
    return (
        <div style={style}><Spin size="large" /></div>
    );
};

export default (loader, loading = loadingComponent) => {
    return Loadable({
        loader,
        loading
    });
};