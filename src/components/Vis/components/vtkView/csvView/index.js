import { connect } from 'react-redux';
import CsvView from './csvView';
// import CsvView1 from './csvView1';
import CsvViewXy from './csvView_xy';
import CsvViewXyz from './csvView_xyz';
import CsvViewXyzNo from './csvView_xyz_no';
import CsvViewCut from "./csvView_cut";

const mapStateToProps = (state, ownProps) => {
    return ({
        state
    })
}
const mapDispatchToProps = (dispatch) => ({
    dispatch
})
export const CsvViewContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(CsvView)
export const CsvViewXyContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(CsvViewXy)
export const CsvViewXyzContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(CsvViewXyz)
export const CsvViewXyzNoContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(CsvViewXyzNo)
export const CsvViewCutContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(CsvViewCut)