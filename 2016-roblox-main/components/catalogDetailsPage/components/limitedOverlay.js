import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    maxWidth: '300px',
    // margin: '0 auto',
    zIndex: 1,
    pointerEvents: 'none',
  },
  img: {
    width: '110px',
    display: 'block',
  },
});

const LimitedOverlay = props => {
  const s = useStyles();
  return <div className={s.wrapper}>
    <img className={s.img} src='/img/limitedOverlay_itemPage.png'>

    </img>
  </div>
}

const LimitedUniqueOverlay = props => {
  const s = useStyles();
  return <div className={s.wrapper}>
    <img className={s.img} src='/img/limitedUniqueOverlay_itemPage.png'>

    </img>
  </div>
}

export {
  LimitedOverlay,
  LimitedUniqueOverlay,
};