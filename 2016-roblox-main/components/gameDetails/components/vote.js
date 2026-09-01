import gameDetailsStore from "../stores/gameDetailsStore";
import { useEffect, useState } from "react";
import { multiGetGameVotes, voteOnGame } from "../../../services/games";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  voteContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 60px)',
    columnGap: '20px',
    rowGap: '2px',
    justifyItems: 'start',
    alignItems: 'center',
    marginLeft: '-4px',
  },
  voteColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    }
  },
  likeItem: {
    justifySelf: 'start',
  },
  dislikeItem: {
    justifySelf: 'end',
  },
  voteIcon: {
    width: '30px',
    height: '30px',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    }
  },
  barsRow: {
    gridColumn: '1 / span 2',
    display: 'flex',
    width: '100%',
    height: '3px',
    gap: '3px',
    marginTop: '6px',
    marginBottom: '6px',
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: '1px',
  },
  segmentGray: {
    backgroundColor: '#dbdbdb',
  },
  segmentGreen: {
    backgroundColor: '#00b06f',
  },
  segmentRed: {
    backgroundColor: '#d84e4e',
  },
  voteCount: {
    fontSize: '11px',
    fontWeight: '500',
  },
  likeText: {
    color: '#00b06f',
  },
  dislikeText: {
    color: '#d84e4e',
  },
});

const Vote = props => {
  const s = useStyles();
  const store = gameDetailsStore.useContainer();
  const [votes, setVotes] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const loadVotes = () => {
    if (store.universeDetails && store.universeDetails.id) {
      multiGetGameVotes({ universeIds: [store.universeDetails.id] }).then(data => {
        setVotes(data[0]);
      })
    }
  }
  useEffect(() => {
    loadVotes();
  }, [store.universeDetails]);

  const submitVote = (didUpvote) => {
    if (locked) return;
    setLocked(true);
    setFeedback(null);

    voteOnGame({ universeId: store.universeDetails.id, isUpvote: didUpvote }).then(result => {
      loadVotes();
    }).catch(e => {
      // error handling preserved from original
      if (!e.response || !e.response.data || !e.response.data.errors) {
        setFeedback('An unknown error has occurred. Try again.');
        return
      }
      const status = e.response.status;
      const err = e.response.data.errors[0];
      const code = err.code;
      const msg = err.message;
      if (status === 403 && code === 6) {
        setFeedback('You must play this game before you can vote on it.');
      } else if (status === 400 && (code === 3 || code === 2)) {
        setFeedback('You cannot vote on this game.');
      } else if (status === 429 && code === 5) {
        setFeedback('Too many attempts to vote. Try again later.');
      } else if (msg) {
        setFeedback(msg);
      }
    }).finally(() => {
      setLocked(false);
    })
  }

  if (votes !== null) {
    const total = votes.upVotes + votes.downVotes;
    const greenPercent = total === 0 ? 0 : (votes.upVotes / total) * 100;

    // 5 segments. Each represents 20%
    const segments = [1, 2, 3, 4, 5].map(i => {
      const threshold = i * 20;
      if (total === 0) return s.segmentGray;
      // If the percentage is greater than or equal to this segment's threshold - 10 (centering the split)
      // or simply based on segments filled. 1st segment is 0-20, 2nd is 20-40, etc.
      // Actually, a simpler way:
      if (greenPercent >= threshold) return s.segmentGreen;
      if (greenPercent <= threshold - 20) return s.segmentRed;

      // For the "split" segment, we pick the dominant color or just default to green if > 50?
      // Roblox usually has a pixel-perfect split but with 5 segments, it's discrete.
      // Let's just use a simple threshold:
      return greenPercent >= threshold - 10 ? s.segmentGreen : s.segmentRed;
    });

    return <div>
      {feedback ? <p className='text-danger mb-0 font-size-12'>{feedback}</p> : null}
      <div className={s.voteContainer}>
        {/* Row 1: Icons */}
        <div className={`${s.voteIcon} ${s.likeItem}`} onClick={() => submitVote(true)} style={{ backgroundImage: 'url("/img/games/like.png")' }} title="Like"></div>
        <div className={`${s.voteIcon} ${s.dislikeItem}`} onClick={() => submitVote(false)} style={{ backgroundImage: 'url("/img/games/dislike.png")' }} title="Dislike"></div>

        {/* Row 2: Segmented Bars */}
        <div className={s.barsRow}>
          {segments.map((segClass, i) => (
            <div key={i} className={`${s.segment} ${segClass}`}></div>
          ))}
        </div>

        {/* Row 3: Counts */}
        <span className={`${s.voteCount} ${s.likeText} ${s.likeItem}`}>{votes.upVotes.toLocaleString()}</span>
        <span className={`${s.voteCount} ${s.dislikeText} ${s.dislikeItem}`}>{votes.downVotes.toLocaleString()}</span>
      </div>
    </div>
  }

  return null;
}

export default Vote;