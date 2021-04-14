const toggleKeduButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_KEDU_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleKeduButton;