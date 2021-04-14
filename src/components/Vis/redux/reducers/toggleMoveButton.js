const toggleMoveButton = (state = "command", action) => {
	switch (action.type) {
		case 'TOGGLE_MOVE_BUTTON':
			return action.display;
		default:
			return state;
	}
}

export default toggleMoveButton;