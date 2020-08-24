/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 登录表单
 */

import React, { Component } from 'react';
import axios from 'axios';
import { withRouter, Link } from "react-router-dom";
import { Form, Icon, Input, Button, message } from "antd";
import { apiurl } from '../../assets/url.js';
import { setCookie } from '../../utils/cookies';
import './index.css';

class LoginForm extends Component {
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
        };
    };
    componentDidMount() {
        const _this = this;
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
    //用户名验证
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
    // 密码验证
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
    // 验证码验证
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
    render() {
        const { getFieldDecorator } = this.props.form;
        let { captchaUrl } = this.state;
        return (
            <div className="login">
                <label className="login-fun">登录</label>
                <Link to="/register" className="changeform">免费注册</Link>
                <Form onSubmit={this.handleSubmit.bind(this)} className="login-form">
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
        )
    }
}
export default withRouter(Form.create({ name: 'login' })(LoginForm));