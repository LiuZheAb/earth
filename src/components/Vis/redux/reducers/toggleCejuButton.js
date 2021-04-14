const toggleCejuButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_CEJU_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleCejuButton;