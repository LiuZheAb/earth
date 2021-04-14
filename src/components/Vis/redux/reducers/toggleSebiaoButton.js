const toggleSebiaoButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_SEBIAO_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleSebiaoButton;