import searchUsersStore from "../stores/searchUsersStore";
import { createUseStyles } from "react-jss";
import useButtonStyles from "../../../styles/buttonStyles";
import ActionButton from "../../actionButton";
import { useEffect, useState } from "react";

const useStyles = createUseStyles({
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '8px 40px 8px 12px',
    border: '1px solid #c3c3c3',
    borderRadius: '2px',
    fontSize: '14px',
    '&:focus': {
      outline: 'none',
      borderColor: '#393939',
    },
  },
  searchIcon: {
    position: 'absolute',
    right: '12px',
    width: '18px',
    height: '18px',
    color: '#666',
    pointerEvents: 'none',
  },
})

const InputRow = props => {
  const store = searchUsersStore.useContainer();
  const s = useStyles();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (store.keyword === query && query !== '') return;
    setQuery(store.keyword || '');
  }, [store.keyword]);

  const onKeyDown = e => {
    if (e.key === 'Enter') {
      store.setKeyword(query);
    }
  }

  return <div className='row'>
    <div className='col-12'>
      <div className={s.inputWrapper}>
        <input
          disabled={store.locked}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          className={s.input}
          type='text'
          placeholder='Username Query'
        />
        <svg className={s.searchIcon} viewBox="0 0 512 512">
          <path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path>
        </svg>
      </div>
    </div>
  </div>
}

export default InputRow;