const data = (state ={} , action) => {
    switch (action.type) {
        case 'GET_DATA':
            return action.display
        default:
            return state
    }
}

export default data;