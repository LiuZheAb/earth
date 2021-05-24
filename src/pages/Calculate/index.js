import React from 'react';
import loadable from '../../utils/lazyLoad';
const NormalCalc = loadable(() => import('./normalCalc'));
const MsemCalc = loadable(() => import('./421Calc'));

export default class index extends React.Component {
    state = {
        idenMod: Number(sessionStorage.getItem("idenMod")) || undefined
    }
    render() {
        let { idenMod } = this.state;
        if (idenMod === 421) {
            return <MsemCalc />
        } else {
            return <NormalCalc />
        }
    }
}
