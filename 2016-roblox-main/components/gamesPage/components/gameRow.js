import { useEffect, useRef, useState } from "react";
import { createUseStyles } from "react-jss";
import SmallGameCard from "../../smallGameCard";
import UserAdvertisement from "../../userAdvertisement";
import useDimensions from "../../../lib/useDimensions";

export const useStyles = createUseStyles({
  title: {
    fontWeight: 300,
    marginBottom: '10px',
    marginTop: '10px',
    color: 'rgb(33, 37, 41)',
    marginLeft: '10px',
  },
  pagerButton: {
    border: '1px solid #c3c3c3',
    width: '40px',
    background: 'rgba(255,255,255,0.8)',
    position: 'absolute',
    top: 0,
    zIndex: 10,
    cursor: 'pointer',
    color: '#666',
    boxShadow: '0 0 3px 0 #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      color: 'black',
      background: 'rgba(255,255,255,1)',
    },
  },
  goBack: {
    left: 0,
  },
  goForward: {
    right: 0,
  },
  pagerCaret: {
    textAlign: 'center',
    userSelect: 'none',
    fontSize: '40px',
    margin: 0,
  },
});

/**
 * A game row
 * @param {{title: string; games: any[]; icons: any; ads?: boolean;}} props
 */
const GameRow = props => {
  const s = useStyles();
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(1);
  const [offsetComp, setOffsetComp] = useState(0);
  const rowRef = useRef(null);
  const gameRowRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(0);

  const [dimensions] = useDimensions();
  useEffect(() => {
    if (!rowRef.current) {
      return
    }
    // width = 170px
    // sub 80 for pagination buttons (if we want to offset content)
    let windowWidth = rowRef.current.clientWidth;
    let offsetNotRounded = (windowWidth) / 164;
    let newLimit = Math.floor(offsetNotRounded);

    setLimit(newLimit);
    if (offsetNotRounded !== newLimit) {
      setOffsetComp(1);
    } else {
      setOffsetComp(0);
    }
  }, [dimensions, props.games, props.icons]);

  useEffect(() => {
    if (!gameRowRef.current)
      return;
    const newHeight = Math.max(240, gameRowRef.current.clientHeight);
    if (newHeight === rowHeight) return;

    setRowHeight(newHeight);
  });
  if (!props.games) return null;

  const remainingGames = props.games.length - (offset - offsetComp);
  const showForward = remainingGames >= limit;
  return <div className='container-list'>
    <div className='col-xs-12 container-header'>
      <h3>{props.title}</h3>
      <a className="btn-more">See All</a>
    </div>
    <div className='row'>
      <div className={props.ads ? 'col-12 col-lg-9' : 'col-12'} style={{ position: 'relative' }} ref={rowRef}>
        <div className={`${s.goBack} ${s.pagerButton} ${offset === 0 ? 'd-none' : ''}`} onClick={() => {
          if (offset === 0) return;
          setOffset((offset - limit));
        }} style={{ height: rowHeight }}>
          <p className={s.pagerCaret}><span className="info-label icon-games-carousel-left"></span></p>
        </div>

        {showForward ? <div className={`${s.goForward} ${s.pagerButton}`} onClick={() => {
          let newOffset = ((offset) + (limit));
          setOffset(newOffset);
        }} style={{ height: rowHeight }}>
          <p className={s.pagerCaret}><span className="info-label icon-games-carousel-right"></span></p>
        </div> : null}

        <ul className='hlist game-cards' ref={gameRowRef} style={{ overflow: 'hidden' }}>
          {
            props.games.slice(offset, offset + 100).map((v, i) => {
              return <SmallGameCard
                key={i}
                placeId={v.placeId}
                creatorId={v.creatorId}
                creatorType={v.creatorType}
                creatorName={v.creatorName}
                iconUrl={props.icons[v.universeId]}
                likes={v.totalUpVotes}
                dislikes={v.totalDownVotes}
                name={v.name}
                playerCount={v.playerCount}
                year={v.year}
              />
            })
          }
        </ul>
      </div>
      {props.ads ? <div className='col-12 col-lg-3'><UserAdvertisement type={3} /></div> : null}
    </div>
  </div>
}

export default GameRow;