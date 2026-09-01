import { createContainer } from "unstated-next";
import { useEffect, useState } from "react";
import { getFriendStatus } from "../../../services/friends";
import { multiGetPresence } from "../../../services/presence";
import getFlag from "../../../lib/getFlag";
import AuthenticationStore from "../../../stores/authentication";
import { searchUsers, getUserInfo } from "../../../services/users";

const SearchUsersStore = createContainer(() => {
  const [keyword, setKeyword] = useState(null);
  const [data, setData] = useState(null);
  const [locked, setLocked] = useState(true);
  const [presence, setPresence] = useState({});
  const [friendStatuses, setFriendStatuses] = useState({});
  const [verifiedUsers, setVerifiedUsers] = useState({});
  const auth = AuthenticationStore.useContainer();

  useEffect(() => {
    if (!keyword && !getFlag('searchUsersAllowNullKeyword', false))
      return;
    setLocked(true);
    searchUsers({ keyword, limit: 12, offset: 0 }).then(d => {
      setData(d);
      const ids = d.UserSearchResults.map(v => v.UserId);
      multiGetPresence({ userIds: ids }).then(presenceData => {
        let obj = {}
        for (const id of presenceData) {
          obj[id.userId] = id;
        }
        setPresence(obj);
      });

      if (process.env.NODE_ENV === 'development') {
        d.UserSearchResults.unshift({
          UserId: 1,
          Name: 'ExampleUser',
          DisplayName: 'ExampleUser',
          UserProfilePageUrl: '/users/1/profile',
          IsVerified: true,
        });
        ids.unshift(1);
      }

      let verifiedObj = {};
      Promise.all(ids.map(id => getUserInfo({ userId: id }).then(info => {
        verifiedObj[id] = info.isVerified;
      }).catch(() => {
        verifiedObj[id] = false;
      }))).then(() => {
        setVerifiedUsers(verifiedObj);
      });

      if (auth.userId) {
        let statuses = {};
        Promise.all(ids.map(id => getFriendStatus({ authenticatedUserId: auth.userId, userId: id }).then(status => {
          statuses[id] = status;
        }).catch(() => {
          statuses[id] = 'NotFriends';
        }))).then(() => {
          setFriendStatuses(statuses);
        })
      }
    }).finally(() => {
      setLocked(false);
    })
  }, [keyword, auth.userId]);

  return {
    keyword,
    setKeyword,

    data,
    setData,

    presence,
    friendStatuses,
    setFriendStatuses,
    verifiedUsers,

    locked,
    setLocked,
  };
});

export default SearchUsersStore;