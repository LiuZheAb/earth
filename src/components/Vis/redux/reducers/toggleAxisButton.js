const toggleAxisButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_AXIS_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleAxisButton;