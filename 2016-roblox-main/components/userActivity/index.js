import { getGameUrl } from "../../services/games";
import Link from "../link";

const Activity = props => {
  const activity = props.lastLocation;
  const online = props.userPresenceType !== 0 && props.userPresenceType !== undefined && props.userPresenceType !== 'Offline';
  if (!online) return null;
  if (activity === 'Playing') {
    return <div>
      <Link href={getGameUrl({
        placeId: props.placeId,
        name: '-',
      })}>
        <a>
          <span className='avatar-status friend-status icon-game' title='Playing' />
        </a>
      </Link>
    </div>
  } else if (activity === 'Website') {
    return <div>
      <span className='avatar-status friend-status icon-online' title='Website' />
    </div>
  } else if (activity === 'Studio') {
    return <div>
      <span className='avatar-status friend-status icon-studio' title='Developing' />
    </div>
  }
  return null;
}

export default Activity;