import { connect } from 'react-redux';
import MshView from './mshView';

const mapStateToProps = (state, ownProps) => {
    return ({
        state
    })
}
const mapDispatchToProps = (dispatch) => ({
    dispatch
})
export const MshViewContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(MshView)