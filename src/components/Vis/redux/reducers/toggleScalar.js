const toggleScalar = (state = 1, action) => {
    switch (action.type) {
        case 'TOGGLE_SCALAR':
            return action.display
        default:
            return state
    }
}

export default toggleScalar;