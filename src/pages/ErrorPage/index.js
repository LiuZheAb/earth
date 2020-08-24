/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 404页面
 */

import React from 'react';
import { Link, withRouter } from "react-router-dom";
import "./index.css";

class ErrorPage extends React.Component {
    constructor() {
        super();
        this.state = {
            seconds: 5,
            timer: () => { }
        };
    };
    componentDidMount() {
        let { seconds, timer } = this.state;
        this.snow();
        this.setState({
            //倒计时跳转
            timer: setInterval(() => {
                this.setState((preState) => ({
                    seconds: preState.seconds - 1,
                }), () => {
                    if (seconds === 0) {
                        clearInterval(timer);
                    }
                });
            }, 1000)
        });
        //倒计时结束后重置seconds
        if (seconds === 0) {
            this.setState({
                seconds: 5,
            });
        };
    };
    //下雪特效
    snow() {
        function ready(fn) {
            if (document.readyState !== 'loading') {
                fn();
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            };
        };
        function makeSnow(el) {
            var ctx = el.getContext('2d');
            var width = 0;
            var height = 0;
            var particles = [];

            var Particle = function () {
                this.x = this.y = this.dx = this.dy = 0;
                this.reset();
            };

            Particle.prototype.reset = function () {
                this.y = Math.random() * height;
                this.x = Math.random() * width;
                this.dx = (Math.random() * 1) - 0.5;
                this.dy = (Math.random() * 0.5) + 0.5;
            };

            function createParticles(count) {
                if (count !== particles.length) {
                    particles = [];
                    for (var i = 0; i < count; i++) {
                        particles.push(new Particle());
                    };
                };
            };

            function onResize() {
                width = window.innerWidth;
                height = window.innerHeight;
                el.width = width;
                el.height = height;

                createParticles((width * height) / 10000);
            };

            function updateParticles() {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = '#f6f9fa';
                particles.forEach(function (particle) {
                    particle.y += particle.dy;
                    particle.x += particle.dx;

                    if (particle.y > height) {
                        particle.y = 0;
                    }

                    if (particle.x > width) {
                        particle.reset();
                        particle.y = 0;
                    }
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2, false);
                    ctx.fill();
                });

                window.requestAnimationFrame(updateParticles);
            };
            onResize();
            updateParticles();
        };
        ready(function () {
            var canvas = document.getElementById('snow');
            makeSnow(canvas);
        });
    };
    componentDidUpdate() {
        if (this.state.seconds === 0) {
            this.props.history.goBack();
        };
    };
    componentWillUnmount() {
        this.setState({
            seconds: 5,
        });
        clearInterval(this.state.timer);
    };
    render() {
        let { seconds } = this.state;
        return (
            <div className="notmatch-content">
                <canvas className="notmatch-snow" id="snow" width="1920" height="917"></canvas>
                <div className="notmatch-main-text">
                    <h1>对不起，<br />页面在雪地里失踪了。</h1>
                    <div className="notmatch-main-text-a">{seconds}秒后将跳回上一页<Link to="/" onClick={() => { this.props.history.goBack() }} style={{ fontSize: "20px", textDecoration: "none" }}>手动跳转</Link></div>
                </div>
                <div className="notmatch-ground">
                    <div className="notmatch-mound">
                        <div className="notmatch-mound_text">404 </div>
                        <div className="notmatch-mound_spade"></div>
                    </div>
                </div>
            </div>
        );
    };
};

export default withRouter(ErrorPage);