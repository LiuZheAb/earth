const toggleDxuanzhuanButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_DXUANZHUAN_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleDxuanzhuanButton;