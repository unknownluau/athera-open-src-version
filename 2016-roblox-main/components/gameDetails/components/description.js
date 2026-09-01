import GameDetailsStore from "../stores/gameDetailsStore";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  header: {
    color: '#757575',
    fontSize: '20px',
    fontWeight: 400,
    marginBottom: '8px',
  },
  descriptionText: {
    whiteSpace: 'break-spaces',
    color: '#343434',
    fontSize: '13px',
    lineHeight: '1.4',
  },
})

const Description = props => {
  const store = GameDetailsStore.useContainer();
  const s = useStyles();
  return <div className='row'>
    <div className='col-12'>
      <h3 className={s.header}>Description</h3>
      <p className={'mb-0 ' + s.descriptionText}>{store.details.description?.trim() || 'No description available'}</p>
    </div>
  </div>
}

export default Description;