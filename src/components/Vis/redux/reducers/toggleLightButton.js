const toggleLightButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_LIGHT_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleLightButton;