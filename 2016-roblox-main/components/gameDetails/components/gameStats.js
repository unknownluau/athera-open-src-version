import dayjs from "dayjs";
import React from "react";
import { createUseStyles } from "react-jss";
import GameDetailsStore from "../stores/gameDetailsStore";

const useStyles = createUseStyles({
  statsContainer: {
    borderTop: '1px solid #c8c8c8',
    borderBottom: '1px solid #c8c8c8',
    padding: '10px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    listStyle: 'none',
    margin: '0',
  },
  statItem: {
    padding: '0 10px',
    textAlign: 'center',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  label: {
    fontSize: '15px',
    fontWeight: '400',
    color: '#343434',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    lineHeight: '1',
  },
  value: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#000',
    lineHeight: '1.2',
  },
  noGearIcon: {
    display: 'inline-block',
    width: '32px',
    height: '32px',
    background: 'url(/img/nogear.png) no-repeat center',
    backgroundSize: 'contain',
    border: '1px dashed #999',
    borderRadius: '2px',
    position: 'relative',
  },
  noGearX: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '18px',
    color: '#777',
    fontWeight: 'bold',
  }
});

const GameStats = props => {
  const s = useStyles();
  const store = GameDetailsStore.useContainer();
  if (!store.placeDetails || !store.universeDetails) return null;

  const { universeDetails } = store;

  const NoGearIcon = () => (
    <div className={s.noGearIcon}>
      <span className={s.noGearX}>x</span>
    </div>
  );

  const stats = [
    { name: 'Playing', value: (universeDetails.playing || 0) },
    { name: 'Favorites', value: (universeDetails.favoritedCount || 0) },
    { name: 'Visits', value: (universeDetails.visits || 0) },
    { name: 'Created', value: dayjs(universeDetails.created).format('M/D/YYYY') },
    { name: 'Updated', value: dayjs(universeDetails.updated).format('M/D/YYYY') },
    { name: 'Year', value: universeDetails.year || 'unknown was here' },
    { name: 'Max Players', value: universeDetails.maxPlayers },
    { name: 'Genre', value: universeDetails.genre },
  ];

  return (
    <ul className={s.statsContainer}>
      {stats.map(v => (
        <li key={v.name} className={s.statItem}>
          <p className={s.label}>{v.name}</p>
          <p className={s.value}>{v.value}</p>
        </li>
      ))}
      <li key='Allowed Gear' className={s.statItem}>
        <p className={s.label}>Allowed Gear</p>
        <div className='mt-1'>
          <NoGearIcon />
        </div>
      </li>
    </ul>
  );
}

export default GameStats;