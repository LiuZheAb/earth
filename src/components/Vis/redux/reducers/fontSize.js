const changeFontSize = (state = 1, action) => {
    switch (action.type) {
        case 'FONT_SIZE':
            return action.value
        default:
            return state
    }
}

export default changeFontSize;