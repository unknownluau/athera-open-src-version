import React from "react";
import { createUseStyles } from "react-jss";
import AuthenticationStore from "../../../stores/authentication";
import GearDropdown from "../../gearDropdown";
import GameDetailsStore from "../stores/gameDetailsStore";
import BuilderDetails from "./builderDetails";
import Description from "./description";
import GameThumbnails from "./gameThumbnails";
import PlayButton from "./playButton";
import Vote from "./vote";
import Favorite from "../../catalogDetailsPage/components/favorite";
import Follow from "./follow";
import Settings from "./settings";

const useStyles = createUseStyles({
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '5px',
  },
  gameTitle: {
    fontWeight: 400,
    fontSize: '30px',
    color: '#343434',
    lineHeight: '1',
    margin: 0,
  },
  creatorRow: {
    fontSize: '12px',
    color: '#343434',
    marginBottom: '10px',
  },
  playContainer: {
    borderBottom: '1px solid #c8c8c8',
    padding: '0 0 20px 0',
    marginBottom: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '350px',
  },
})

const GameOverview = props => {
  const s = useStyles();
  const store = GameDetailsStore.useContainer();
  const auth = AuthenticationStore.useContainer();
  if (!store.details || !store.placeDetails || !store.universeDetails) return null;

  const showSettings = store.details.creatorType === 'User' && store.details.creatorTargetId === auth.userId;

  return <div className='row'>
    {/* Left Column: Thumbnails */}
    <div className='col-12 col-lg-8'>
      <GameThumbnails />
    </div>

    <div className={`col-12 col-lg-4 ${s.rightColumn}`}>
      <div className={s.titleRow}>
        <h2 className={s.gameTitle}>{store.details.name}</h2>
        {showSettings && <Settings placeId={store.details.id} />}
      </div>

      <div className={s.creatorRow}>
        <BuilderDetails creatorId={store.details.creatorTargetId} creatorName={store.details.creatorName} creatorType={store.details.creatorType} />
      </div>

      <div className={s.playContainer}>
        <PlayButton placeId={store.details.id} />
      </div>

      <div className={s.actionsContainer}>
        {store.universeDetails ? <Favorite assetId={store.details.id} favoriteCount={store.universeDetails.favoritedCount} /> : null}
        <Follow />
        <Vote placeId={store.details.id} />
      </div>
    </div>
  </div>
}

export default GameOverview;