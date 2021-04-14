const toggleShitidanyuanButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_SHITI_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleShitidanyuanButton;