const toggleFuweiButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_FUWEI_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleFuweiButton;