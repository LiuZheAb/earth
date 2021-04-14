const toggleResultButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_RESULT_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleResultButton;