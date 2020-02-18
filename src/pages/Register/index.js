//前台注册页面
import React from 'react';
import { Form, Icon, Input, Button, Tooltip, Checkbox, AutoComplete, Alert, message } from 'antd';
// eslint-disable-next-line 
import { HashRouter as Router, Route, Link } from "react-router-dom";
import Particles from 'react-particles-js';
import axios from 'axios';
import { apiurl } from '../../assets/urls';
import './index.css';
import { setCookie } from '../../utils/cookies';

const AutoCompleteOption = AutoComplete.Option;

class Register extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            captchaUrl: '',
            captchaId: '',
            message: '',
            username: '',
            email: '',
            password: '',
            confirmpassword: '',
            captcha: '',
            registerState: '',
            autoCompleteResult: [],
            invisible: true,
        };
        this.handleClose = this.handleClose.bind(this);
        this.handleSubmitregister = this.handleSubmitregister.bind(this);
    };
    componentDidMount() {
        const _this = this;
        document.title = "注册";
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
                    invisible: false
                });
            });
    }
    //刷新验证码
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
        } else if (this.state.registerState === 2) {
            callback(this.state.message);
        } else if (/^[0-9a-zA-Z]{4,16}$/.test(value) === false) {
            callback('用户名格式不符合要求！');
        } else {
            callback();
        };
    };
    emailValidator = (rule, value, callback) => {
        if (!value) {
            callback('邮箱不能为空!');
        } else if (/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value) === false) {
            callback('请输入正确的邮箱格式！');
        } else {
            callback();
        };
    };
    handleWebsiteChange = value => {
        let autoCompleteResult;
        if (!value || /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value) === true) {
            autoCompleteResult = [];
        } else {
            autoCompleteResult = ['@qq.com', '@163.com', '@126.com', '@gmail.com', '@sina.com', '@yahoo.com'].map(domain => `${value}${domain}`);
        }
        this.setState({
            autoCompleteResult: autoCompleteResult,
            email: value
        });
    };
    passwordValidator = (rule, value, callback) => {
        if (!value) {
            callback('请输入密码!');
        } else if (/^[0-9a-zA-Z]{4,16}$/.test(value) === false) {
            callback('密码格式不符合要求');
        } else {
            callback();
        };
    };
    confirmPasswordValidator = (rule, value, callback) => {
        if (!value) {
            callback('请再次输入密码!');
        } else if (value !== this.state.password) {
            callback('两次输入的密码不一致，请重新输入！');
        } else {
            callback();
        };
    };
    captchaValidator = (rule, value, callback) => {
        if (!value) {
            callback("验证码不能为空!");
        } else if (this.state.registerState === 3) {
            callback(this.state.message);
        } else if (/^[0-9]{4,4}$/.test(value) === false) {
            callback('验证码必须为4位数字!');
        } else {
            callback();
        };
    };
    checkboxValidator = (rule, e, callback) => {
        if (!e) {
            callback("请勾选同意协议");
        } else {
            callback();
        };
    };
    //注册提交表单时调用
    handleSubmitregister = (e) => {
        e.preventDefault();
        const _this = this;
        let { username, password, captcha, captchaId, email } = this.state;
        _this.props.form.validateFields({ force: true }, (err, values) => {
            if (!err) {
                axios({
                    method: 'post',
                    url: apiurl + 'register',
                    responseType: 'json',
                    data: {
                        username: username,
                        password: password,
                        captcha: captcha,
                        captcha_id: captchaId,
                        email: email
                    },
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(function (response) {
                        _this.setState({
                            registerState: response.data["status"],
                            message: response.data["message"]
                        });
                        _this.props.form.validateFields({ force: true }, (err, values) => {
                            // eslint-disable-next-line 
                            switch (response.data["status"]) {
                                case 0: {
                                    setTimeout(_this.setState({
                                        registerState: 4,
                                        captchaUrl: apiurl + "captcha/" + captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                                case 1: {
                                    message.success("注册成功", 1);
                                    setCookie("userName", username);
                                    setTimeout(() => {
                                        _this.props.history.push('/home');
                                    }, 1000);
                                    break;
                                }
                                case 2: {
                                    setTimeout(_this.setState({
                                        registerState: 4,
                                        captchaUrl: apiurl + "captcha/" + captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                                case 3: {
                                    setTimeout(_this.setState({
                                        registerState: 4,
                                        captchaUrl: apiurl + "captcha/" + captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                            };
                        });
                    })
                    .catch(function (error) {
                        message.error("注册失败", 2);
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
        const { autoCompleteResult, invisible, captchaUrl } = this.state;
        const websiteOptions = autoCompleteResult.map(website => (
            <AutoCompleteOption key={website}>{website}</AutoCompleteOption>
        ));
        return (
            <div className="register-page">
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
                <div className="register-main">
                    {/* 动态粒子背景 */}
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
                    <header style={invisible ? { top: "0" } : { top: "37px" }} >
                        <div className="logo">
                            {/* eslint-disable-next-line */}
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" height="24" />
                            <span>综合地球物理联合反演与解释一体化平台</span>
                        </div>
                    </header>
                    <div className="register-banner">
                        <div className="earth">
                            <img src={require("../../assets/images/circle.png")} alt="地球" draggable="false" className="earth-circle" />
                            <img src={require("../../assets/images/1_0000.gif")} alt="地球" draggable="false" style={{ opacity: 0.85 }} />
                        </div>
                        {/* <!-- 注册表单 --> */}
                        <div className="register">
                            <Link to="/login" className="changeform">已有账号，直接登陆</Link>
                            <label className="register-fun">账号注册</label>
                            <Form onSubmit={this.handleSubmitregister} className="register-form">
                                <Form.Item hasFeedback>
                                    <Tooltip placement="top" title="用户名由4-16位英文或数字组成，不能包含特殊字符">
                                        {getFieldDecorator('username', {
                                            rules: [{ validator: this.usernameValidator }],
                                            //禁止输入空格
                                            getValueFromEvent: (event) => {
                                                return event.target.value.replace(/\s+/g, "")
                                            },
                                        })(
                                            <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="用户名"
                                                onChange={this.handleChange.bind(this, 'username')} />
                                        )}
                                    </Tooltip>
                                </Form.Item>
                                <Form.Item hasFeedback>
                                    <Tooltip placement="top" title="请输入你的邮箱地址">
                                        {getFieldDecorator('email', {
                                            rules: [{ validator: this.emailValidator }],
                                        })(
                                            <AutoComplete dataSource={websiteOptions} onChange={this.handleWebsiteChange}>
                                                <Input prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="邮箱" />
                                            </AutoComplete>
                                        )}
                                    </Tooltip>
                                </Form.Item>
                                <Form.Item hasFeedback>
                                    <Tooltip placement="top" title="密码由4-16位英文或数字组成，不能包含特殊字符">
                                        {getFieldDecorator('password', {
                                            rules: [{ validator: this.passwordValidator }],
                                        })(
                                            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="密码"
                                                onChange={this.handleChange.bind(this, 'password')} />
                                        )}
                                    </Tooltip>
                                </Form.Item>
                                <Form.Item hasFeedback>
                                    <Tooltip placement="top" title="请再次输入密码">
                                        {getFieldDecorator('confirmpassword', {
                                            rules: [{ validator: this.confirmPasswordValidator }]
                                        })(
                                            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="请再次输入密码"
                                                onChange={this.handleChange.bind(this, 'confirmpassword')} />
                                        )}
                                    </Tooltip>
                                </Form.Item>
                                <Form.Item className="captcha">
                                    {getFieldDecorator('captcha', {
                                        rules: [{ validator: this.captchaValidator }],
                                    })(
                                        <Input prefix={<Icon type="safety-certificate" style={{ color: 'rgba(0,0,0,.25)' }} />} type="captcha" placeholder="验证码" onChange={this.handleChange.bind(this, 'captcha')} />
                                    )}
                                    <img src={captchaUrl} alt="验证码" onClick={this.handleClick} />
                                </Form.Item>

                                <Form.Item>
                                    {getFieldDecorator('agreement', {
                                        rules: [{ validator: this.checkboxValidator }],
                                    })(
                                        <Checkbox>
                                            我已阅读<Link to="/about" onClick={this.setSiderkey.bind(this, "4")}>《法律声明和隐私权政策》</Link>
                                        </Checkbox>,
                                    )}
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" className="register-form-button">
                                        注册
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </div>
                </div>
                {/* <!-- 底部导航 --> */}
                <footer className="register-footer">
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "1")}>关于我们</Link>
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "4")}>法律声明及隐私权政策</Link>
                    <Link to="/about" onClick={this.setSiderkey.bind(this, "5")}>联系我们</Link>
                </footer>
            </div >
        )
    }
}
export default Form.create({ name: 'register' })(Register);