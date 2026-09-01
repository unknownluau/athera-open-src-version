import searchUsersStore from "../stores/searchUsersStore";
import { createUseStyles } from "react-jss";
import { getTheme } from "../../../services/theme";
import PlayerImage from "../../playerImage";
import dayjs from "../../../lib/dayjs";
import Link from "../../link";
import { sendFriendRequest } from "../../../services/friends";
import AuthenticationStore from "../../../stores/authentication";

const useStyles = createUseStyles({
  userCard: {
    border: p => p.theme === 'obc2016' ? '1px solid #444' : '1px solid #c3c3c3',
    overflow: 'hidden',
    background: p => p.theme === 'obc2016' ? 'transparent' : '#fff',
    borderRadius: '2px',
    marginBottom: '20px',
  },
  cardTop: {
    height: '110px',
    display: 'flex',
    padding: '15px',
    alignItems: 'center',
  },
  cardBottom: {
    padding: '8px',
    background: p => p.theme === 'obc2016' ? 'transparent' : '#f2f2f2',
    borderTop: p => p.theme === 'obc2016' ? '1px solid #444' : '1px solid #c3c3c3',
    textAlign: 'center',
  },
  avatarWrapper: {
    width: '80px',
    height: '80px',
    flexShrink: 0,
    marginRight: '15px',
    borderRadius: '50%',
    border: p => p.theme === 'obc2016' ? '1px solid #444' : '1px solid #c3c3c3',
    position: 'relative',
    overflow: 'visible',
    '& img': {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
    }
  },
  statusIconWrapper: {
    position: "absolute",
    bottom: '-8px',
    right: '-8px',
    border: p => p.theme === 'obc2016' ? '2px solid #222' : '2px solid #fff',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    backgroundColor: p => p.theme === 'obc2016' ? '#222' : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  statusIcon: {
    width: '28px',
    height: '28px',
    display: 'inline-block',
  },
  userInfo: {
    flexGrow: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  username: {
    fontSize: '13px',
    fontWeight: 350,
    marginBottom: '2px',
    color: p => p.theme === 'obc2016' ? '#fff' : '#343434',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    '&:hover': {
      textDecoration: 'underline',
    }
  },
  status: {
    fontSize: '14px',
    margin: 0,
  },
  online: {
    color: '#00bf00',
  },
  offline: {
    color: '#666',
  },
  addButton: {
    background: p => p.theme === 'obc2016' ? 'transparent' : '#fff',
    border: p => p.theme === 'obc2016' ? '1px solid #444' : '1px solid #c3c3c3',
    padding: '4px 12px',
    fontSize: '13px',
    borderRadius: '2px',
    cursor: 'pointer',
    color: p => p.theme === 'obc2016' ? '#fff' : 'inherit',
    '&:hover': {
      background: p => p.theme === 'obc2016' ? '#333' : '#f2f2f2',
    }
  }
});

const UsersRow = props => {
  const store = searchUsersStore.useContainer();
  const auth = AuthenticationStore.useContainer();
  const theme = getTheme();
  const s = useStyles({ theme });

  if (!store.data || !store.data.UserSearchResults)
    return null;

  return <div className='row mt-2'>
    {
      store.data.UserSearchResults.length ? store.data.UserSearchResults.map(v => {
        const presence = store.presence[v.UserId];
        const isOnline = presence && presence.userPresenceType !== 0 && presence.userPresenceType !== 'Offline';
        const friendStatus = store.friendStatuses[v.UserId];
        const isOwnProfile = auth.userId == v.UserId;

        let statusIcon = null;
        if (isOnline) {
          if (presence.userPresenceType === 2 || presence.userPresenceType === 'InGame' || presence.lastLocation === 'Playing') {
            statusIcon = 'icon-game';
          } else if (presence.userPresenceType === 3 || presence.userPresenceType === 'InStudio' || presence.lastLocation === 'Studio') {
            statusIcon = 'icon-studio';
          } else {
            statusIcon = 'icon-online';
          }
        }

        return <div className='col-12 col-md-6 col-lg-4' key={v.UserId}>
          <div className={s.userCard}>
            <div className={s.cardTop}>
              <div className={s.avatarWrapper}>
                <Link href={v.UserProfilePageUrl}>
                  <a>
                    <PlayerImage id={v.UserId} useHeadshot={false} />
                  </a>
                </Link>
                {statusIcon && <div className={s.statusIconWrapper}>
                  <span className={`avatar-status friend-status ${statusIcon} ${s.statusIcon}`} title={presence.lastLocation || ''} />
                </div>}
              </div>
              <div className={s.userInfo}>
                <div className='d-flex align-items-center'>
                  <Link href={v.UserProfilePageUrl}>
                    <a className={s.username}>{v.Name}</a>
                  </Link>
                  {store.verifiedUsers[v.UserId] && <img src="/verified.svg" alt="Verified" style={{ width: '20px', height: '20px', marginLeft: '5px' }} />}
                </div>
                <p className={s.status + ' ' + (isOnline ? s.online : s.offline)}>
                  {isOnline ? (presence.lastLocation || 'Online') : 'Offline'}
                </p>
              </div>
            </div>
            <div className={s.cardBottom}>
              {(!auth.userId || isOwnProfile) ? null : (
                friendStatus === 'Friends' ? (
                  <Link href={'/messages/compose?recipientId=' + v.UserId}>
                    <a className={s.addButton + ' d-inline-block text-decoration-none'}>Chat</a>
                  </Link>
                ) : friendStatus === 'RequestSent' ? (
                  <button className={s.addButton} disabled>Pending</button>
                ) : (
                  <button className={s.addButton} onClick={() => {
                    sendFriendRequest({ userId: v.UserId }).then(() => {
                      store.setFriendStatuses({ ...store.friendStatuses, [v.UserId]: 'RequestSent' });
                    })
                  }}>Add Friend</button>
                )
              )}
            </div>
          </div>
        </div>
      }) : <div className='col-12'>
        <p className='mt-4'>No results for "{store.keyword}"</p>
      </div>
    }
  </div>
}

export default UsersRow;