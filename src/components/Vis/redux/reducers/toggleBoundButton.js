const toggleBoundButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_BOUND_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleBoundButton;