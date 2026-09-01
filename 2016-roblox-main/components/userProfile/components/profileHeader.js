import React, { useEffect, useRef, useState } from "react";
import { createUseStyles } from "react-jss";
import { followUser, unfollowUser } from "../../../services/friends";
import { multiGetPresence } from "../../../services/presence";
import { getMembershipType, updateStatus, getMyInfo } from "../../../services/users";
import { launchGame, multiGetPlaceDetails, multiGetUniverseDetails } from "../../../services/games";
import AuthenticationStore from "../../../stores/authentication";
import Dropdown2016 from "../../dropdown2016";
import PlayerHeadshot from "../../playerHeadshot";
import Activity from "../../userActivity";
import UserProfileStore from "../stores/UserProfileStore";
import useCardStyles from "../styles/card";
import FriendButton from "./friendButton";
import RelationshipStatistics from "./relationshipStatistics";

const useHeaderStyles = createUseStyles({
  iconWrapper: {
    border: '1px solid #B8B8B8',
    margin: '0 auto',
    maxWidth: '130px',
    borderRadius: '50%',
    overflow: 'hidden',
    width: '130px',
    height: '130px',
  },
  username: {
    fontSize: '30px',
    fontWeight: 400,
  },
  userStatus: {
    fontSize: '16px',
    fontWeight: 300,
  },
  dropdown: {
    float: 'right',
  },
  updateStatusInput: {
    width: 'calc(100% - 140px)',
    border: '1px solid #c3c3c3',
    borderRadius: '4px',
    '@media(max-width: 992px)': {
      width: '100%',
    }
  },
  updateStatusButton: {
    cursor: 'pointer',
    marginTop: '2px',
    fontSize: '12px',
  },
  activityWrapper: {
    position: "relative",
    float: 'right',
    marginRight: '-10px',
    marginTop: '-18px',
  },
  joinButton: {
    background: '#02b757',
    border: '1px solid #02b757',
    color: 'white',
    fontSize: '18px',
    padding: '6px 0',
    width: '100%',
    borderRadius: '2px',
    textAlign: 'center',
    display: 'block',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background 0.2s ease',
    '&:hover': {
      background: '#3fc679',
      borderColor: '#3fc679',
      boxShadow: '0 1px 3px rgb(150 150 150 / 74%)',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      background: '#02b757',
    }
  },
});

const ProfileHeader = props => {
  const auth = AuthenticationStore.useContainer();
  const store = UserProfileStore.useContainer();

  const statusInput = useRef(null);

  const [dropdownOptions, setDropdownOptions] = useState(null);
  const [editStatus, setEditStatus] = useState(false);
  const [status, setStatus] = useState(null);
  const [bcLevel, setBcLevel] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      getMyInfo().then(d => {
        setIsAdmin(d.isStaff);
      }).catch(e => {
        setIsAdmin(false);
      })
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    // reset
    setStatus(null);
    setBcLevel(0);
    setEditStatus(false);
    setDropdownOptions(null);

  }, [store.userId]);

  useEffect(() => {
    if (auth.isPending) return;

    multiGetPresence({ userIds: [store.userId] }).then((d) => {
      const presence = d[0];
      if (presence && presence.lastLocation === 'Playing' && presence.placeId) {
        multiGetPlaceDetails({ placeIds: [presence.placeId] }).then(placeDetails => {
          if (placeDetails[0]) {
            multiGetUniverseDetails({ universeIds: [placeDetails[0].universeId] }).then(universeDetails => {
              if (universeDetails[0]) {
                setStatus({
                  ...presence,
                  year: universeDetails[0].year,
                });
              } else {
                setStatus(presence);
              }
            })
          } else {
            setStatus(presence);
          }
        })
      } else {
        setStatus(presence);
      }
    });
    getMembershipType({ userId: store.userId }).then(d => {
      setBcLevel(d);
    }).catch(e => {
      // can fail when not logged in :(
    })
    const buttons = [];
    const isOwnProfile = auth.userId == store.userId;
    if (isOwnProfile) {
      // Exclusive to your own profile
      buttons.push({
        name: 'Update Status',
        onClick: e => {
          e.preventDefault();
          setEditStatus(!editStatus);
        },
      })
    } else {
      // Exclusive to profiles other than your own
      buttons.push({
        name: store.isFollowing ? 'Unfollow' : 'Follow',
        onClick: (e) => {
          e.preventDefault();
          store.setIsFollowing(!store.isFollowing);
          if (store.isFollowing) {
            store.setFollowersCount(store.followersCount - 1);
            unfollowUser({ userId: store.userId });
          } else {
            store.setFollowersCount(store.followersCount + 1);
            followUser({ userId: store.userId });
          }
        },
      });
    }
    // TODO: wait for accountsettings to add "get blocked status" endpoint
    /*
    arr.push({
      name: 'Block User',
      onClick: () => {
        console.log('Block user!');
      },
    });
    */
    buttons.push({
      name: 'Inventory',
      url: `/users/${store.userId}/inventory`,
    });
    buttons.push({
      name: 'Collectibles',
      url: `https://athermons.athera.sbs/collectibles/?user=${store.userId}`,
    });
    if (!isOwnProfile) {
      buttons.push({
        name: 'Trade',
        onClick: (e) => {
          e.preventDefault();
          window.open("/Trade/TradeWindow.aspx?TradePartnerID=" + store.userId, "_blank", "scrollbars=0, height=608, width=914");
        }
      });
      buttons.push({
        name: 'Message',
        url: '/messages/compose?recipientId=' + store.userId,
      });
    }
    if (isAdmin) {
      buttons.push({
        name: 'Manage User',
        url: `https://athera.sbs/admin/manage-user/${store.userId}`,
      });
    }
    setDropdownOptions(buttons);
  }, [auth.userId, auth.isPending, store.isFollowing, editStatus, store.userId, isAdmin]);

  const s = useHeaderStyles();
  const cardStyles = useCardStyles();

  const showButtons = auth.userId != store.userId && !auth.isPending;

  const BcIcon = () => {
    if (bcLevel === 0 && !store.isVerified) {
      return null;
    }

    const RenderBCIcon = () => {
      switch (bcLevel) {
        case 1:
        case 4:
          return <span className="icon-bc" />
        case 2:
          return <span className="icon-tbc" />
        case 3:
          return <span className="icon-obc" />
        default:
          return null;
      }
    };

    return (
      <>
        {store.isVerified && <img src="/verified.svg" alt="Verified" style={{ width: '20px', height: '20px', marginRight: '5px' }} />}
        {bcLevel !== 0 && RenderBCIcon()}
      </>
    );
  }

  return <div className='row mt-2'>
    <div className='col-12'>
      <div className={'card ' + cardStyles.card}>
        <div className='card-body'>
          <div className='row'>
            <div className='col-12 col-lg-2 pe-0'>
              <div className={s.iconWrapper}>
                <PlayerHeadshot id={store.userId} name={store.username} />
                {status && <div className={s.activityWrapper}><Activity relative={false} {...status}></Activity></div>}
              </div>
            </div>
            <div className='col-12 col-lg-10 ps-0'>
              <h2 className={s.username}>{store.username} {<BcIcon />} <div className={s.dropdown}>
                {dropdownOptions && <Dropdown2016 options={dropdownOptions} />}
              </div></h2>
              {editStatus ? <div>
                <input ref={statusInput} type='text' className={s.updateStatusInput} maxLength={255} defaultValue={store.status?.status || ''} />
                <p className={s.updateStatusButton} onClick={() => {
                  let v = statusInput.current.value;
                  store.setStatus({
                    status: v,
                  });
                  setEditStatus(false);
                  updateStatus({
                    newStatus: v,
                    userId: auth.userId,
                  })
                }}>Update Status</p>
              </div> : (!store.status || !store.status.status) ? <p>&emsp;</p> : <p className={s.userStatus}>&quot;{store.status.status}&quot;</p>
              }
              <div className='row'>
                <RelationshipStatistics id='friends' label='Friends' value={store.friends?.length} userId={store.userId} />
                <RelationshipStatistics id='followers' label='Followers' value={store.followersCount} userId={store.userId} />
                <RelationshipStatistics id='followings' label='Following' value={store.followingsCount} userId={store.userId} />
                <RelationshipStatistics id='rap' label='Total Rap' value={store.totalRap} userId={store.userId} url={`https://athermons.athera.sbs/collectibles/?user=${store.userId}`} />
                {
                  showButtons && <>
                    <div className='col-6 col-lg-2 pe-1'>
                      <button
                        className={s.joinButton}
                        onClick={() => {
                          launchGame({
                            placeId: status.placeId,
                            jobId: status.jobId,
                            year: status.year || 2020,
                          })
                        }}
                        disabled={!status || status.lastLocation !== 'Playing'}
                        title={(!status || status.lastLocation !== 'Playing') ? 'This user is not currently in a game.' : ''}
                      >
                        Join
                      </button>
                    </div>
                    <div className='col-6 col-lg-2 ps-1'>
                      <FriendButton />
                    </div>
                  </>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default ProfileHeader;