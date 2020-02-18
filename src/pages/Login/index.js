//前台登录页面
import React from 'react';
import { Form, Icon, Input, Button, Alert, message } from 'antd';
// eslint-disable-next-line 
import { HashRouter as Router, Route, Link } from "react-router-dom";
import Particles from 'react-particles-js';
import axios from 'axios';
import './index.css';
import { apiurl } from '../../assets/urls';
import { setCookie } from '../../utils/cookies';

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            captcha: '',
            value: '',
            captchaUrl: '',
            captchaId: '',
            isLoaded: false,
            message: '',
            loginState: 4,
            invisible: true,
        };
        this.handleClose = this.handleClose.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    };
    componentDidMount() {
        const _this = this;
        document.title = "登录";
        //获取验证码
        axios.get(apiurl + 'firstgetcaptcha')
            .then(function (response) {
                _this.setState({
                    captchaId: response.data["getCaptchaID"],
                    captchaUrl: apiurl + "captcha/" + response.data["getCaptchaID"] + '.png',
                    isLoaded: true,
                    invisible: true
                });
            })
            .catch(function (error) {
                message.error("服务器无响应", 2);
                _this.setState({
                    isLoaded: false,
                    invisible: false,
                    error: error
                });
            });
    };
    //点击验证码时调用，刷新验证码
    handleClick = () => {
        if (this.state.captchaId) {
            this.setState({ captchaUrl: apiurl + "captcha/" + this.state.captchaId + '.png?reload=' + (new Date()).getTime() });
        } else {
            const _this = this;
            axios.get(apiurl + 'firstgetcaptcha')
                .then(function (response) {
                    _this.setState({
                        captchaId: response.data["getCaptchaID"],
                        captchaUrl: apiurl + "captcha/" + response.data["getCaptchaID"] + '.png',
                        isLoaded: true,
                    });
                })
                .catch(function (error) {
                    message.error("服务器无响应", 2);
                    _this.setState({
                        isLoaded: false,
                        error: error
                    });
                });
        }
    };
    //获取用户输入的各项信息
    handleChange(key, e) {
        this.setState({ [key]: e.target.value });
    };
    //表单验证
    usernameValidator = (rule, value, callback) => {
        if (!value) {
            callback('用户名不能为空!');
        } else if (/^[0-9a-zA-Z]{4,16}$/.test(value) === false) {
            callback('用户名由4-16位英文或数字组成！');
        } else if (this.state.loginState === 0) {
            callback(this.state.message);
        } else {
            callback();
        };
    };
    passwordValidator = (rule, value, callback) => {
        if (!value) {
            callback('请输入密码!');
        } else if (/^[0-9a-zA-Z]{4,16}$/.test(value) === false) {
            callback('请正确填写密码！');
        } else if (this.state.loginState === 1) {
            callback(this.state.message);
        } else {
            callback();
        };
    };
    captchaValidator = (rule, value, callback) => {
        if (!value) {
            callback("验证码不能为空!");
        } else if (/^[0-9]{4,4}$/.test(value) === false) {
            callback('验证码必须为4位数字!');
        } else if (this.state.loginState === 2) {
            callback(this.state.message);
        } else {
            callback();
        };
    };
    //登录提交表单时调用
    handleSubmit = (e) => {
        e.preventDefault();
        const _this = this;
        let { username, password, captcha, captchaId } = this.state;
        _this.props.form.validateFields({ force: true }, (err, values) => {
            if (!err) {
                axios({
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method: 'post',
                    url: apiurl + 'login',
                    responseType: 'json',
                    data: {
                        username: username,
                        password: password,
                        captcha: captcha,
                        captcha_id: captchaId,
                    }
                })
                    .then(function (response) {
                        _this.setState({
                            loginState: response.data["status"],
                            message: response.data["message"]
                        });
                        _this.props.form.validateFields({ force: true }, (err, values) => {
                            // eslint-disable-next-line 
                            switch (response.data["status"]) {
                                case 0: {
                                    //若登陆失败，将登录状态重置为4，为了将错误信息重置
                                    setTimeout(_this.setState({
                                        loginState: 4,
                                        captchaUrl: apiurl + "captcha/" + _this.state.captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                                case 1: {
                                    setTimeout(_this.setState({
                                        loginState: 4,
                                        captchaUrl: apiurl + "captcha/" + _this.state.captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                                case 2: {
                                    setTimeout(_this.setState({
                                        loginState: 4,
                                        captchaUrl: apiurl + "captcha/" + _this.state.captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                                case 3: {
                                    setCookie("userName", username);
                                    _this.props.history.push('/home');
                                    break;
                                }
                            };
                        });
                    })
                    .catch(function (error) {
                        message.error("登录失败", 2);
                    });
            };
        });
    };
    setSiderkey(index) {
        sessionStorage.setItem('aboutSiderKey', index);
    };
    handleClose() {
        this.setState({ invisible: true });
    };
    render() {
        const { getFieldDecorator } = this.props.form;
        const { invisible, captchaUrl } = this.state;
        return (
            <div className="login-page">
                {invisible ? (
                    null
                ) : <Alert
                        message="验证码获取失败，请联系管理员"
                        type="error"
                        closable
                        afterClose={this.handleClose}
                        style={{ width: "100%" }}
                        banner
                    />}
                <div className="login-main">
                    {/* 动态粒子背景  */}
                    <Particles className="test-particles" style={invisible ? { top: "0" } : { top: "37px" }} params={{
                        particles: {
                            number: {
                                value: 40,
                                density: {
                                    enable: true,
                                    value_area: 800
                                }
                            },
                            color: {
                                value: "#ffffff"
                            },
                            shape: {
                                type: "circle",
                                stroke: {
                                    width: 0,
                                    color: "#000000"
                                },
                                polygon: {
                                    nb_sides: 5
                                },
                                image: {
                                    src: "img/github.svg",
                                    width: 100,
                                    height: 100
                                }
                            },
                            opacity: {
                                value: 0.7,
                                random: false,
                                anim: {
                                    enable: false,
                                    speed: 1,
                                    opacity_min: 0.1,
                                    sync: false
                                }
                            },
                            size: {
                                value: 3,
                                random: true,
                                anim: {
                                    enable: false,
                                    speed: 40,
                                    size_min: 0.1,
                                    sync: false
                                }
                            },
                            line_linked: {
                                enable: true,
                                distance: 150,
                                color: "#ffffff",
                                opacity: 0.8,
                                width: 1
                            },
                            move: {
                                enable: true,
                                speed: 6,
                                direction: "none",
                                random: false,
                                straight: false,
                                out_mode: "out",
                                "bounce": false,
                                attract: {
                                    enable: false,
                                    rotateX: 600,
                                    rotateY: 1200
                                }
                            }
                        },
                        interactivity: {
                            detect_on: "canvas",
                            events: {
                                onhover: {
                                    enable: true,
                                    mode: "grab"
                                },
                                onclick: {
                                    enable: true,
                                    mode: "push"
                                },
                                resize: true
                            },
                            modes: {
                                grab: {
                                    distance: 200,
                                    line_linked: {
                                        opacity: 1
                                    }
                                },
                                bubble: {
                                    distance: 400,
                                    size: 40,
                                    duration: 2,
                                    opacity: 8,
                                    speed: 3
                                },
                                repulse: {
                                    distance: 200,
                                    duration: 0.4
                                },
                                push: {
                                    particles_nb: 4
                                },
                                remove: {
                                    particles_nb: 2
                                }
                            }
                        },
                        retina_detect: false
                    }}
                    />
                    <header style={invisible ? { top: "0" } : { top: "37px" }}>
                        <div className="logo">
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" height="24" />
                            <span>综合地球物理联合反演与解释一体化平台</span>
                        </div>
                    </header>
                    <div className="login-banner">
                        <div className="earth">
                            <img src={require("../../assets/images/circle.png")} alt="地球" draggable="false" className="earth-circle" />
                            <img src={require("../../assets/images/1_0000.gif")} alt="地球" draggable="false" style={{ opacity: 0.85 }} />
                        </div>
                        {/* <!-- 登录表单 --> */}
                        <div className="login">
                            <label className="login-fun">登录</label>
                            <Link to="/register" className="changeform">免费注册</Link>
                            <Form onSubmit={this.handleSubmit} className="login-form">
                                {/* hasFeedback为输入框尾部的小图标 */}
                                <Form.Item hasFeedback>
                                    {getFieldDecorator('username', {
                                        rules: [{ validator: this.usernameValidator }],
                                        getValueFromEvent: (event) => {
                                            return event.target.value.replace(/\s+/g, "")
                                        },
                                    })(
                                        <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="用户名"
                                            onChange={this.handleChange.bind(this, 'username')} />
                                    )}
                                </Form.Item>
                                <Form.Item hasFeedback>
                                    {getFieldDecorator('password', {
                                        rules: [{ validator: this.passwordValidator }]
                                    })(
                                        <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="密码"
                                            onChange={this.handleChange.bind(this, 'password')} />
                                    )}
                                </Form.Item>
                                <Form.Item className="captcha">
                                    {getFieldDecorator('captcha', {
                                        rules: [{ validator: this.captchaValidator }]
                                    })(
                                        <Input prefix={<Icon type="safety-certificate" style={{ color: 'rgba(0,0,0,.25)' }} />} type="captcha" placeholder="验证码" onChange={this.handleChange.bind(this, 'captcha')} />

                                    )}
                                    <img src={captchaUrl} alt="验证码" onClick={this.handleClick} />
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" className="login-form-button">
                                        登录
                                    </Button>
                                </Form.Item>
                            </Form>
                            <div className="forgot">
                                {/* eslint-disable-next-line */}
                                <Link to="/">忘记密码</Link>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <!-- 底部导航 --> */}
                <footer className="login-footer">
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "1")}>关于我们</Link>
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "4")}>法律声明及隐私权政策</Link>
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "5")}>联系我们</Link>
                </footer>
            </div>
        );
    };
};

export default Form.create({ name: 'login' })(Login);