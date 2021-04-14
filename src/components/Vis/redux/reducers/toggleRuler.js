const toggleRuler = (state = true, action) => {
    switch (action.type) {
        case 'TOGGLE_RULER':
            return action.display
        default:
            return state
    }
}

export default toggleRuler;