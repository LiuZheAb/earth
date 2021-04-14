const toggleWanggeButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_WANGGE_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleWanggeButton;