const toggleRaogoujianxuanzhuanButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_ZHOUXUANZHUAN_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleRaogoujianxuanzhuanButton;