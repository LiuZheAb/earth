import { combineReducers } from 'redux';
import modelStyle from './setModelStyle';
import moveStyle from './setMoveStyle';
import attribute from './toggleAttribute';
import axis from './toggleAxis';
import bounds from './toggleBounds';
import light from './toggleLight';
import result from './toggleResult';
import scalar from './toggleScalar';
import screen from './screen';
import reset from './reset';
import scale from './toggleScale';
import ruler from './toggleRuler';
import ranging from './ranging';
import theme from './toggleTheme';
import fontSize from './fontSize';
import axisButton from './toggleAxisButton';
import boundButton from './toggleBoundButton';
import lightButton from './toggleLightButton';
import resultButton from './toggleResultButton';
import scaleButton from './toggleScaleButton';
import fuweiButton from './toggleFuweiButton';
import dxuanzhuanButton from './toggleDxuanzhuanButton';
import raogoujianxuanzhuanButton from './toggleRaogoujianxuanzhuanButton';
import moveButton from './toggleMoveButton';
import shitidanyuanButton from './toggleShitidanyuanButton';
import wanggeButton from './toggleWanggeButton';
import pointButton from './togglePointButton';
import keduButton from './toggleKeduButton';
import cejuButton from './toggleCejuButton';
import sebiaoButton from './toggleSebiaoButton';
import data from './data' ;
import datatype from './datatype' ;

export default combineReducers({
    fuweiButton,
    dxuanzhuanButton,
    raogoujianxuanzhuanButton,
    moveButton,
    shitidanyuanButton,
    wanggeButton,
    pointButton,
    keduButton,
    cejuButton,
    sebiaoButton,
    modelStyle,
    moveStyle,
    attribute,
    axis,
    bounds,
    light,
    result,
    scalar,
    screen,
    reset,
    scale,
    ruler,
    ranging,
    theme,
    fontSize,
    axisButton,
    boundButton,
    lightButton,
    resultButton,
    scaleButton,
    data,
    datatype
})