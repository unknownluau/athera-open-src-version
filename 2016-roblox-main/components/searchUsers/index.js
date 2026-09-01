import UserAdvertisement from "../userAdvertisement";
import Container from "./components/container";
import SearchUsersStore from "./stores/searchUsersStore";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  container: {
    maxWidth: '970px',
    margin: '0 auto',
  },
  main: {
    minHeight: '95vh',
  }
})

const SearchUsers = props => {
  const s = useStyles();
  const SearchUsersStoreProvider = SearchUsersStore.Provider;
  return <div className={s.main}>
    <div className={s.container + ' container'}>
      <div className='row'>
        <div className='col-12'>
          <div className='mb-4'>
            <UserAdvertisement type={1} />
          </div>
          <SearchUsersStoreProvider>
            <Container keyword={props.keyword} />
          </SearchUsersStoreProvider>
          <p className='text-center mt-4 text-muted'>User Search Re-Design by RCC</p>
        </div>
      </div>
    </div>
  </div>
}

export default SearchUsers;