import CreatorLink from "../../creatorLink";
import PlayerImage from "../../playerImage";

const BuilderDetails = props => {
  const { creatorId, creatorType, creatorName } = props;

  return <div className='row'>
    <div className='col-12'>
      <span className='mb-0 fw-600 lighten-2 font-size-15 me-1 text-secondary'>By</span>
      <span className='mb-0 fw-500 font-size-15'><CreatorLink id={creatorId} name={creatorName} type={creatorType}></CreatorLink></span>
    </div>
  </div>
}

export default BuilderDetails;