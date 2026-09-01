import { useEffect, useRef } from "react";
import { createUseStyles } from "react-jss";
import CatalogPageStore from "../../stores/catalogPage";
import buttonStyles from '../../styles/buttons.module.css';

const useInputStyles = createUseStyles({
  input: {
    width: '100%',
    border: '1px solid #a7a7a7',
    padding: '8px 36px 8px 12px',   // 🔥 bigger padding
    fontSize: '14px',      // 🔥 bigger text
    height: '40px',        // 🔥 taller input
    borderRadius: '4px',   // optional (Roblox-like)
    marginBottom: '5px',
  },
  select: {
    width: '100%',
    padding: '8px 16px',
    border: '1px solid #a7a7a7',
    appearance: 'none',
    height: '40px',
    fontSize: '14px',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  col: {
    padding: 0,
    paddingLeft: '2px',
  },
  searchButton: {
    width: '100%',
    height: '40px',
    background: '#ffffff',
    border: '1px solid #a7a7a7',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&:hover': {
      background: '#f8f9fa',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  searchIcon: {
    width: '20px',
    height: '20px',
    fill: '#a7a7a7',
  },
  caret: {
    position: 'absolute',
    marginLeft: '-21px',
    fontSize: '8px',
    transform: 'rotate(90deg)',
    marginTop: '6px',
    border: '1px solid black',
    paddingLeft: '3px',
    paddingRight: '1px',
    background: 'linear-gradient(90deg, rgba(224,224,224,1) 0%, rgba(255,255,255,1) 100%)',
  },
})

/**
 * Catalog page search input
 * @param {*} props 
 */
const CatalogPageInput = props => {
  const s = useInputStyles();
  const store = CatalogPageStore.useContainer();

  const input = useRef(null);
  const category = useRef(null);

  useEffect(() => {
    // for keyword updates from url param
    if (input.current)
      input.current.value = store.query;
  }, [store.query]);

  return <div className='row'>
    <div className='col-12 col-lg-8 offset-lg-4'>
      <div className='row'>
        <div className={`col-12 col-md-6 ${s.col}`}>
          <input type='text' placeholder="Search" className={`${s.input}`} ref={input} />
        </div>
        <div className={`col-6 col-md-3 ${s.col}`}>
          <select disabled={store.locked} className={s.select} ref={category}>
            <option value='all'>All Categories</option>
          </select>
          <span className={s.caret}>►</span>
        </div>
        <div className={`col-6 col-md-2 ${s.col}`}>
          <button disabled={store.locked} className={s.searchButton} onClick={(e) => {
            e.preventDefault();
            store.setQuery(input.current.value);
          }}>
            <svg className={s.searchIcon} viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
}

export default CatalogPageInput;