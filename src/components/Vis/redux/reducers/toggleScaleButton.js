const toggleScaleButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_SCALE_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleScaleButton;