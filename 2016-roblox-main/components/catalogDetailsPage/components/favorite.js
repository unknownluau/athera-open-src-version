import { useEffect, useState } from "react";
import { createFavorite, deleteFavorite, getIsFavorited } from "../../../services/catalog";
import authentication from "../../../stores/authentication";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: '-1px',
  },
  favoriteStar: {
    display: 'block',
    width: '32px',
    height: '32px',
    marginBottom: '4px',
    margin: '0 auto',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '12px',
    color: '#343434',
    fontWeight: 500,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'none',
      color: '#343434',
    }
  }
});

const Favorite = props => {
  const { assetId } = props;
  const auth = authentication.useContainer();
  const s = useStyles();

  const [isFavorited, setIsFavorited] = useState(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setIsFavorited(null);
    setFavoriteCount(props.favoriteCount);
    setLocked(false);

    if (auth.userId) {
      getIsFavorited({ assetId, userId: auth.userId }).then(data => {
        setIsFavorited(!!data);
      }).catch(e => {
        setIsFavorited(false);
      })
    }
  }, [props.favoriteCount, props.assetId, auth.userId]);

  if (isFavorited === null) return null;

  return <div className={s.wrapper}>
    <a href="#" className={s.link} onClick={e => {
      e.preventDefault();
      if (locked) return;
      setLocked(true);
      setIsFavorited(!isFavorited);
      setFavoriteCount(isFavorited ? favoriteCount - 1 : favoriteCount + 1);
      if (isFavorited) {
        deleteFavorite({ userId: auth.userId, assetId }).finally(() => {
          setLocked(false);
        })
      } else {
        createFavorite({ userId: auth.userId, assetId }).finally(() => {
          setLocked(false);
        })
      }
    }}>
      <div className={s.favoriteStar} style={{
        backgroundImage: isFavorited ? 'url("/img/games/favorited.png")' : 'url("/img/games/favorite.png")',
      }} />
      <span>{isFavorited ? 'Unfavorite' : 'Favorite'}</span>
    </a>
  </div>
}

export default Favorite;