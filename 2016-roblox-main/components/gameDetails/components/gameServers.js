import React, { useEffect } from "react";
import { createUseStyles } from "react-jss";
import { getServers, launchGame } from "../../../services/games";
import GameDetailsStore from "../stores/gameDetailsStore";

const useStyles = createUseStyles({
  sectionTitle: {
    fontWeight: 400,
    fontSize: '18px',
    color: '#656666',
    marginBottom: '10px',
    marginTop: '15px',
  },
  emptyBanner: {
    backgroundColor: '#B8B8B8',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#656666',
    fontSize: '14px',
    marginBottom: '25px',
  },
  serverRow: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #D6D6D6',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    marginBottom: '8px',
  },
  serverInfo: {
    width: '150px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  playerCount: {
    fontSize: '12px',
    color: '#BDC3C7',
  },
  joinBtn: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #B8B8B8',
    color: '#393B3D',
    padding: '4px 0',
    width: '130px',
    textAlign: 'center',
    fontSize: '13px',
    cursor: 'pointer',
    borderRadius: '2px',
    '&:hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  avatarList: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  avatarCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '1px solid #E3E3E3',
    overflow: 'hidden',
    backgroundColor: '#F2F4F5',
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  },
  loadMore: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D6D6D6',
    padding: '10px 0',
    textAlign: 'center',
    color: '#393B3D',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '5px',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: '#f9f9f9',
    },
    '&:active': {
      backgroundColor: '#f0f0f0',
    },
  },
  noServers: {
    textAlign: 'center',
    color: '#656666',
    fontSize: '14px',
    padding: '20px 0',
  },
});

const ServerEntry = props => {
  const store = GameDetailsStore.useContainer();
  const s = useStyles();

  if (!store.universeDetails) return null;

  const maxPlayers = store.universeDetails?.maxPlayers || '?';

  return <div className={s.serverRow}>
    <div className={s.serverInfo}>
      <span className={s.playerCount}>{props.CurrentPlayers.length} of {maxPlayers} players max</span>
      <button className={s.joinBtn} onClick={() => {
        launchGame({
          placeId: store.details.id,
          jobId: props.Guid,
          year: store.universeDetails?.year || 2017
        });
      }}>Join</button>
    </div>
    <div className={s.avatarList}>
      {
        props.CurrentPlayers.map(v => {
          return <div className={s.avatarCircle} key={v.Id} title={v.Username}>
            <img src={`/Thumbs/Avatar-Headshot.ashx?userid=${v.Id}`} alt={v.Username} />
          </div>
        })
      }
    </div>
  </div>
}

const GameServers = props => {
  const store = GameDetailsStore.useContainer();
  const s = useStyles();
  const showButton = !store.servers || store.servers && store.servers.areMoreAvailable && !store.servers.loading;

  const loadMore = (isInitial = false) => {
    if (store.servers && store.servers.loading) {
      return;
    }
    const offset = isInitial ? 0 : (store.servers && store.servers.offset || 0);

    if (isInitial && store.servers && store.servers.Collection) {
      return;
    }

    if (isInitial) {
      store.setServers({
        loading: true,
      });
    }

    getServers({
      placeId: store.details.id,
      offset: offset,
    }).then(servers => {
      store.setServers({
        ...servers,
        Collection: isInitial ? servers.Collection : [...(store.servers?.Collection || []), ...servers.Collection],
        loading: false,
        areMoreAvailable: servers.Collection.length >= 10,
        offset: offset + 10,
      })
    })
  }

  useEffect(() => {
    if (!store.servers) {
      loadMore(true);
    }
  }, []);

  const hasServers = store.servers && store.servers.Collection && store.servers.Collection.length > 0;

  return <div>
    <h2 className={s.sectionTitle}>Other Servers</h2>

    {
      hasServers ? store.servers.Collection.map(v => {
        return <ServerEntry key={v.Guid} {...v}></ServerEntry>
      }) : null
    }
    {
      store.servers && store.servers.Collection && store.servers.Collection.length === 0 &&
      <p className={s.noServers}>Nobody is playing this game.</p>
    }
    {
      showButton && <div className={s.loadMore} onClick={() => loadMore()}>
        {store.servers?.loading ? 'Loading...' : 'Load More'}
      </div>
    }
  </div>
}

export default GameServers;