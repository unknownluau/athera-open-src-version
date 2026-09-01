import React, { useEffect, useRef } from "react";
import { createUseStyles } from "react-jss";
import NotFoundPage from "../../pages/404";
import AuthenticationStore from "../../stores/authentication";
import AdBanner from "../ad/adBanner";
import Avatar from "./components/avatar";
import Collections from "./components/collections";
import Creations from "./components/creations";
import Description from "./components/description";
import Friends from "./components/friends";
import Groups from "./components/groups";
import ProfileHeader from "./components/profileHeader";
import RobloxBadges from "./components/robloxBadges";
import Badges from "./components/Badges";
import Statistics from "./components/stats";
import Tabs from "./components/tabs";
import TabSection from "./components/tabSection";
import UserProfileStore from "./stores/UserProfileStore";
import Favorites from "./components/favorites";
import { getBaseUrl } from "../../lib/request";

const useStyles = createUseStyles({
  profileContainer: {
    background: '#e3e3e3',
  },
  hiddenAudio: {
    display: 'none',
  }
})

const UserProfile = props => {
  const s = useStyles();
  const audioRef = useRef(null);
  const hasPlayed = useRef(false);

  const store = UserProfileStore.useContainer();
  const auth = AuthenticationStore.useContainer();

  useEffect(() => {
    store.setUserId(props.userId);
  }, [props]);

  useEffect(() => {
    if (auth.isPending || !auth.userId || !store.userId) return;
    store.getFriendStatus(auth.userId);
  }, [store.userId, auth.userId, auth.isPending]);

  const playOnInteraction = () => {
    if (hasPlayed.current || !audioRef.current || !store.userInfo?.profileMusicAssetId) return;
    audioRef.current.play().catch(err => {
      console.warn("Failed to play profile music:", err);
    });
    hasPlayed.current = true;
    document.removeEventListener("click", playOnInteraction);
    document.removeEventListener("keydown", playOnInteraction);
  };

  useEffect(() => {
    hasPlayed.current = false;
    if (store.userInfo?.profileMusicAssetId) {
      document.addEventListener("click", playOnInteraction);
      document.addEventListener("keydown", playOnInteraction);
    }
    return () => {
      document.removeEventListener("click", playOnInteraction);
      document.removeEventListener("keydown", playOnInteraction);
    };
  }, [store.userInfo?.profileMusicAssetId]);

  if (!store.userId || !store.userInfo || auth.isPending) {
    return null;
  }
  if (store.userInfo.isBanned) {
    return <NotFoundPage/>
  }
  return <div className='container'>
    <AdBanner/>
    <div className={s.profileContainer}>
      {store.userInfo?.profileMusicAssetId && (
        <audio
          ref={audioRef}
          src={getBaseUrl() + 'asset/?id=' + store.userInfo.profileMusicAssetId}
          loop
          autoPlay
          className={s.hiddenAudio}
        />
      )}
      <ProfileHeader/>
      <Tabs/>
      <TabSection tab="About">
        <Description/>
        <Avatar userId={store.userId}/>
        <Friends/>
        <Collections userId={store.userId}/>
        <Groups/>
        <Favorites userId={store.userId} />
		<Badges userId={store.userId}/>
        <RobloxBadges userId={store.userId}/>
        <Statistics/>
      </TabSection>
      <TabSection tab="Creations">
        <Creations/>
      </TabSection>
    </div>
  </div>
}

export default UserProfile;