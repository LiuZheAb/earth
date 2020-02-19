//前台登录、注册页面
import React from 'react';
import { Alert } from 'antd';
// eslint-disable-next-line 
import { HashRouter as Router, Route, Link } from "react-router-dom";
import Particles from '../../components/Particles';
import loadable from '../../utils/lazyLoad';
import './index.css';

const LoginForm = loadable(() => import('../../components/LoginForm'));
const RegisterForm = loadable(() => import('../../components/RegisterForm'));

class LoginRegister extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            invisible: true,
        };
    };
    setSiderkey(index) {
        sessionStorage.setItem('aboutSiderKey', index);
    };
    handleClose() {
        this.setState({ invisible: true });
    };
    render() {
        const { invisible } = this.state;
        return (
            <div className="login-register">
                {invisible ? (
                    null
                ) : <Alert
                        message="验证码获取失败，请联系管理员"
                        type="error"
                        closable
                        afterClose={this.handleClose.bind(this)}
                        style={{ width: "100%" }}
                        banner
                    />}
                <div className="lr-main">
                    {/* 动态粒子背景  */}
                    <Particles invisible={invisible} />
                    <header style={invisible ? { top: "0" } : { top: "37px" }}>
                        <div className="lr-logo">
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" height="24" />
                            <span>综合地球物理联合反演与解释一体化平台</span>
                        </div>
                    </header>
                    <div className="lr-banner">
                        <div className="earth">
                            <img src={require("../../assets/images/circle.png")} alt="地球" draggable="false" className="earth-circle" />
                            <img src={require("../../assets/images/1_0000.gif")} alt="地球" draggable="false" style={{ opacity: 0.85 }} />
                        </div>
                        <Router >
                            {/* <!-- 登录表单 --> */}
                            <Route path="/login"><LoginForm /></Route>
                            {/* <!-- 注册表单 --> */}
                            <Route path="/register"><RegisterForm /></Route>
                        </Router>

                    </div>
                </div>
                {/* <!-- 底部导航 --> */}
                <footer className="lr-footer">
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "1")}>关于我们</Link>
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "4")}>法律声明及隐私权政策</Link>
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "5")}>联系我们</Link>
                </footer>
            </div>
        );
    };
};

export default LoginRegister;