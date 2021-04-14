const togglePointButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_POINT_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default togglePointButton;