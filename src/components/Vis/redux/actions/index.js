export const setMoveStyle = value => ({
    type: 'SET_MOVE_STYLE',
    value
})
export const moveType = {
    ROTATE: 'ROTATE',
    ROOL: 'ROLL',
    PAN: 'PAN',
    NONE: 'NONE'
}

export const setModelStyle = style => ({
    type: 'SET_MODEL_STYLE',
    style
})

export const ModelStyle = {
    SHOW_POLY: 'POLY',
    SHOW_RESET: 'RESET',
    SHOW_LINE: 'LINE',
    SHOW_POINT: 'POINT'
}

export const toggleAxis = display => ({
    type: 'TOGGLE_AXIS',
    display
})

export const toggleBounds = display => ({
    type: 'TOGGLE_BOUNDS',
    display
})

export const toggleScalar = display => ({
    type: 'TOGGLE_SCALAR',
    display
})

export const toggleResult = display => ({
    type: 'TOGGLE_RESULT',
    display
})

export const toggleLight = display => ({
    type: 'TOGGLE_LIGHT',
    display
})

export const toggleAttribute = display => ({
    type: 'TOGGLE_ATTRIBUTE',
    display
})

export const toggleScale = display => ({
    type: 'TOGGLE_SCALE',
    display
})

export const toggleRuler = display => ({
    type: 'TOGGLE_RULER',
    display
})

export const toggleTheme = theme => ({
    type: 'TOGGLE_THEME',
    theme
})

export const ranging = change => ({
    type: 'RANGING',
    change
})

export const screen = value => ({
    type: 'SCREEN',
    value
})

export const reset = value => ({
    type: 'RESET',
    value
})
export const fontSize = value => ({
    type: 'FONT_SIZE',
    value
})
export const toggleFuweiButton = display => ({
    type: 'TOGGLE_FUWEI_BUTTON',
    display
})
export const toggleDxuanzhuanButton = display => ({
    type: 'TOGGLE_DXUANZHUAN_BUTTON',
    display
})
export const toggleRaogoujianxuanzhuanButton = display => ({
    type: 'TOGGLE_ZHOUXUANZHUAN_BUTTON',
    display
})
export const toggleMoveButton = display => ({
    type: 'TOGGLE_MOVE_BUTTON',
    display
})
export const toggleShitidanyuanButton = display => ({
    type: 'TOGGLE_SHITI_BUTTON',
    display
})
export const toggleWanggeButton = display => ({
    type: 'TOGGLE_WANGGE_BUTTON',
    display
})
export const togglePointButton = display => ({
    type: 'TOGGLE_POINT_BUTTON',
    display
})
export const toggleAxisButton = display => ({
    type: 'TOGGLE_AXIS_BUTTON',
    display
})
export const toggleKeduButton = display => ({
    type: 'TOGGLE_KEDU_BUTTON',
    display
})
export const toggleScaleButton = display => ({
    type: 'TOGGLE_SCALE_BUTTON',
    display
})
export const toggleCejuButton = display => ({
    type: 'TOGGLE_CEJU_BUTTON',
    display
})
export const toggleBoundButton = display => ({
    type: 'TOGGLE_BOUND_BUTTON',
    display
})
export const toggleSebiaoButton = display => ({
    type: 'TOGGLE_SEBIAO_BUTTON',
    display
})
export const toggleResultButton = display => ({
    type: 'TOGGLE_RESULT_BUTTON',
    display
})
export const toggleLightButton = display => ({
    type: 'TOGGLE_LIGHT_BUTTON',
    display
})

export const getData = display => ({
    type: 'GET_DATA',
    display
})

export const getDataType = display => ({
    type: 'GET_DATATYPE',
    display
})