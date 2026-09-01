import searchUsersStore from "../stores/searchUsersStore";
import { useEffect } from "react";
import InputRow from "./inputRow";
import UsersRow from "./usersRow";
import { createUseStyles } from "react-jss";
import { getTheme } from "../../../services/theme";

const useStyles = createUseStyles({
  row: {
    background: p => p.theme === 'obc2016' ? 'transparent' : '#e3e3e3',
    minHeight: '100vh',
    padding: '20px',
  },
  header: {
    fontSize: '24px',
    fontWeight: 400,
    marginBottom: '15px',
    color: p => p.theme === 'obc2016' ? '#fff' : '#343434',
  },
  keyword: {
    fontWeight: 700,
  },
  countInfo: {
    fontSize: '12px',
    color: p => p.theme === 'obc2016' ? '#fff' : '#666',
    marginBottom: '10px',
  }
})

const Container = props => {
  const store = searchUsersStore.useContainer();
  const theme = getTheme();
  const s = useStyles({ theme });
  useEffect(() => {
    store.setKeyword(props.keyword);
    store.setData(null);
  }, [props.keyword]);

  const resultsCount = store.data?.UserSearchResults?.length || 0;
  const totalResults = store.data?.TotalResults || 0;
  const start = resultsCount > 0 ? (store.data?.StartIndex || 0) + 1 : 0;
  const end = (store.data?.StartIndex || 0) + resultsCount;

  return <div className={'row ' + s.row}>
    <div className='col-12'>
      <h2 className={s.header}>Player Results for <span className={s.keyword}>{store.keyword}</span></h2>
      <InputRow />
      <p className={s.countInfo}>{start} - {end} of {totalResults}</p>
      <UsersRow />
    </div>
  </div>
}

export default Container;