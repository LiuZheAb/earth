const datatype = (state ='' , action) => {
    switch (action.type) {
        case 'GET_DATATYPE':
            return action.display
        default:
            return state
    }
}

export default datatype;