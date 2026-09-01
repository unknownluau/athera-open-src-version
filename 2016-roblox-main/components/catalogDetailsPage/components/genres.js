import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  header: {
    color: '#999',
    fontSize: '12px',
    marginBottom: 0,
  },
  genre: {
    fontSize: '12px',
    color: '#0055B3',
  },
});

const genreToHuman = str => {
  switch (str) {
    case 'TownAndCity':
      return 'Town and City';
    default:
      return str;
  }
}

const Genres = props => {
  const s = useStyles();
  if (!props.genres || props.genres.length === 0) return <span>None</span>;
  return <span>
    {props.genres.map((v, i) => {
      return <span className={s.genre} key={v}>
        {genreToHuman(v)}{i !== props.genres.length - 1 ? ', ' : ''}
      </span>
    })}
  </span>
}

export default Genres;