/**
* 文件名：/MenuBar/index.js
* 作者：鲁杨飞
* 创建时间：2020/8/24
* 文件描述：顶部菜单栏部分。
*/
import React from 'react';
import { Layout, Tooltip } from "antd";
import '../../assets/IconFont/iconfont.css';
import '../../index.css';
import * as actions from '../../redux/actions/index';
import store from '../../redux/store/index';

// import html2canvas from 'html2canvas';
const { Header } = Layout;

export default class MenuBar extends React.Component {
	componentDidMount = () => {
		let _this = this
		_this.props.dispatch(actions.fontSize(1 / window.devicePixelRatio));
		if (window.attachEvent) {//判断是不是IE
			window.onresize = function () {
				_this.props.dispatch(actions.fontSize(1 / window.devicePixelRatio));
			}
			// window.attachEvent("onresize",_this.iegbck() );
		} else if (window.addEventListener) {//如果非IE执行以下方法
			window.addEventListener("resize", () => {
				_this.props.dispatch(actions.fontSize(1 / window.devicePixelRatio));
				if (document.querySelector(".textCanvas")) {
					document.querySelector(".textCanvas").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
					document.querySelector(".textCanvas").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
				}
			});
		}
	}

	keyDownR = () => {
		this.props.dispatch(actions.setModelStyle(actions.ModelStyle.SHOW_RESET));

	};

	keyDownS = () => {
		this.props.dispatch(actions.setModelStyle(actions.ModelStyle.SHOW_POLY));
	};

	keyDownW = () => {
		this.props.dispatch(actions.setModelStyle(actions.ModelStyle.SHOW_LINE));
	};

	keyDownV = () => {
		this.props.dispatch(actions.setModelStyle(actions.ModelStyle.SHOW_POINT));
	};

	changeAxis = () => {
		let axis = store.getState().axis;
		axis === true ? this.props.dispatch(actions.toggleAxis(false)) : this.props.dispatch(actions.toggleAxis(true));
	};
	// usePointPicker = () => {
	//   let { usePointPicker } = this.state;
	//   let { usePointPic } = this.props;
	//   if (usePointPicker) {
	//     this.setState({
	//       usePointPicker: false
	//     });
	//     usePointPic(false);
	//   } else {
	//     this.setState({
	//       usePointPicker: true
	//     });
	//     usePointPic(true);
	//   }
	// };

	// useCellPicker = () => {
	//   let { useCellPicker } = this.state;
	//   let { useCellPic } = this.props;
	//   if (useCellPicker) {
	//     this.setState({
	//       useCellPicker: false
	//     });
	//     useCellPic(false);
	//   } else {
	//     this.setState({
	//       useCellPicker: true
	//     });
	//     useCellPic(true);
	//   }
	// };

	setting = () => {
		let attr = store.getState().attribute;
		attr === "none" ? this.props.dispatch(actions.toggleAttribute("block")) : this.props.dispatch(actions.toggleAttribute("none"));
	};

	settingBar = () => {
		let scalar = store.getState().scalar;
		scalar === 0 ? this.props.dispatch(actions.toggleScalar(1)) : this.props.dispatch(actions.toggleScalar(0));
	};

	onButtonRotate = () => {
		this.props.dispatch(actions.setMoveStyle(actions.moveType.ROTATE));
	};

	onButtonRoll = () => {
		this.props.dispatch(actions.setMoveStyle(actions.moveType.ROOL));
	};

	onButtonPan = () => {
		this.props.dispatch(actions.setMoveStyle(actions.moveType.PAN));
	};

	// onButtonZoom = () => { //缩放
	//   let { getOperation } = this.props;
	//   getOperation("Zoom");
	// };

	settingScalsr = () => {
		let result = store.getState().result;
		result === true ? this.props.dispatch(actions.toggleResult(false)) : this.props.dispatch(actions.toggleResult(true));
	};

	settingLight = () => {
		let light = store.getState().light;
		light === true ? this.props.dispatch(actions.toggleLight(false)) : this.props.dispatch(actions.toggleLight(true));
	};

	Screen = () => {
		let screen = store.getState().screen
		screen === true ? this.props.dispatch(actions.screen(false)) : this.props.dispatch(actions.screen(true));
	};

	setBounds = () => {
		let bounds = store.getState().bounds;
		bounds === true ? this.props.dispatch(actions.toggleBounds(false)) : this.props.dispatch(actions.toggleBounds(true));
	}

	changeRuler = () => {
		let ruler = store.getState().ruler;
		ruler === true ? (() => {
			this.props.dispatch(actions.toggleRuler(false));
		})() : (() => {
			this.props.dispatch(actions.toggleRuler(true));
		})()
	}

	changeScale = () => {
		let scale = store.getState().scale;
		scale === true ? (() => {
			this.props.dispatch(actions.toggleScale(false));
		})() : (() => {
			this.props.dispatch(actions.toggleScale(true));
		})()
	}

	changeDistance = () => {
		let ranging = store.getState().ranging;
		ranging === true ? (() => {
			this.props.dispatch(actions.ranging(false));
		})() : (() => {
			this.props.dispatch(actions.ranging(true));
		})()
	}

	toggleTheme = () => {
		let theme = store.getState().theme;
		theme === "dark" ? (() => {
			this.props.dispatch(actions.toggleTheme("light"));
		})() : (() => {
			this.props.dispatch(actions.toggleTheme("dark"));
		})()
	}
	render() {
		let { state } = this.props;
		let { fuweiButton, dxuanzhuanButton, raogoujianxuanzhuanButton, moveButton, shitidanyuanButton, wanggeButton, pointButton, keduButton, cejuButton, sebiaoButton, axisButton, boundButton, lightButton, resultButton, scaleButton } = state;
		return (
			<Header className="header" role="navigation" style={this.props.style}>
				<div className={fuweiButton}>
					<Tooltip title='复位' placement="bottom" onClick={fuweiButton === "command" ? this.keyDownR : () => { return; }}>
						<i className="iconfont iconfuwei" type="iconfuwei" />
					</Tooltip>
				</div>
				<div className='commands'></div>
				<div className={dxuanzhuanButton}>
					<Tooltip title='3D旋转' placement="bottom" onClick={dxuanzhuanButton === "command" ? this.onButtonRotate : () => { return; }}>
						<i className="iconfont iconDxuanzhuan" type="iconDxuanzhuan" />
					</Tooltip>
				</div>
				<div className={raogoujianxuanzhuanButton}>
					<Tooltip title='轴旋转' placement="bottom" onClick={raogoujianxuanzhuanButton === "command" ? this.onButtonRoll : () => { return; }}>
						<i className="iconfont iconweiraogoujianxuanzhuan" type="iconweiraogoujianxuanzhuan" />
					</Tooltip>
				</div>
				<div className={moveButton}>
					<Tooltip title='拖动' placement="bottom" onClick={moveButton === "command" ? this.onButtonPan : () => { return; }}>
						<i className="iconfont iconmove" type="iconmove" />
					</Tooltip>
				</div>
				{/* <div className='commands'></div>
        <div className='command'>
          <Tooltip title='缩放' placement="bottom" onClick={this.onButtonZoom}>
            <i className="iconfont " type="iconiconset0442" />
          </Tooltip>
        </div> */}

				<div className='commands'></div>
				<div className={shitidanyuanButton}>
					<Tooltip title='显示为实体单元' placement="bottom" onClick={shitidanyuanButton === "command" ? this.keyDownS : () => { return; }}>
						<i className="iconfont iconcubelifangti" type="iconcubelifangti" />
					</Tooltip>
				</div>
				<div className={wanggeButton}>
					<Tooltip title='显示为网格' placement="bottom" onClick={wanggeButton === "command" ? this.keyDownW : () => { return; }}>
						<i className="iconfont iconplus-gridview" type="iconplus-gridview" />
					</Tooltip>
				</div>
				<div className={pointButton}>
					<Tooltip title='显示所有点' placement="bottom" onClick={pointButton === "command" ? this.keyDownV : () => { return; }}>
						<i className="iconfont icondianxian" type="icondianxian" />
					</Tooltip>
				</div>
				<div className='commands'></div>
				<div className={axisButton} >
					<Tooltip title='坐标定位' placement="bottom" onClick={axisButton === "command" ? this.changeAxis : () => { return; }}>
						<i className="iconfont iconsanweizuobiao" type="iconsanweizuobiao" />
					</Tooltip>
				</div>
				<div className={keduButton}>
					<Tooltip title='显示刻度' placement="bottom" onClick={keduButton === "command" ? this.changeRuler : () => { return; }}>
						<i className="iconfont iconkeduchi" type="iconkeduchi" />
					</Tooltip>
				</div>
				<div className={scaleButton} >
					<Tooltip title='比例尺' placement="bottom" onClick={scaleButton === "command" ? this.changeScale : () => { return; }}>
						<i className="iconfont iconbilichi" type="iconbilichi" />
					</Tooltip>
				</div>
				<div className={cejuButton}>
					<Tooltip title='测距' placement="bottom" onClick={cejuButton === "command" ? this.changeDistance : () => { return; }}>
						<i className="iconfont iconceju" type="iconceju" />
					</Tooltip>
				</div>
				<div className={boundButton} >
					<Tooltip title='显示边框' placement="bottom" onClick={boundButton === "command" ? this.setBounds : () => { return; }}>
						<i className="iconfont iconicon-lifangti" type="iconicon-lifangti" />
					</Tooltip>
				</div>
				{/* <div className='commands'></div>
        <div className='command'>
          <Tooltip title='点拾取（鼠标右击）' placement="bottom" onClick={this.usePointPicker}>
            <i className="iconfont " type="icondian" />
          </Tooltip>
        </div>
        <div className='command'>
          <Tooltip title='单元拾取（鼠标右击）' placement="bottom" onClick={this.useCellPicker}>
            <i className="iconfont " type="iconcell" />
          </Tooltip>
        </div> */}
				<div className='commands'></div>
				<div className={sebiaoButton}>
					<Tooltip title='色标卡' placement="bottom" onClick={sebiaoButton === "command" ? this.settingBar : () => { return; }}>
						<i className="iconfont iconyanse" type="iconyanse" />
					</Tooltip>
				</div>
				<div className={resultButton} >
					<Tooltip title='数据结果显示' placement="bottom" onClick={resultButton === "command" ? this.settingScalsr : () => { return; }}>
						<i className="iconfont iconshujujieguotongji" type="iconshujujieguotongji" />
					</Tooltip>
				</div>
				<div className={lightButton}>
					<Tooltip title='灯光' placement="bottom" onClick={lightButton === "command" ? this.settingLight : () => { return; }}>
						<i className="iconfont iconlightbulb-on" type="iconlightbulb-on" />
					</Tooltip>
				</div>
				<div className='commands'></div>
				{/* <div className='command'>
					<Tooltip title='截屏' placement="bottom" onClick={this.Screen}>
						<i className="iconfont iconjieping" type="iconjieping" />
					</Tooltip>
				</div> */}
				<div className='command'>
					<Tooltip title='切换主题' placement="bottom" onClick={this.toggleTheme}>
						<i className="iconfont iconzhuti" type="iconzhuti" />
					</Tooltip>
				</div>
				<div className='command'>
					<Tooltip title='设置属性' placement="bottom" onClick={this.setting}>
						<i className="iconfont iconset" type="iconset" />
					</Tooltip>
				</div>
			</Header>
		);
	};
};