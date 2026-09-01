import React, { useEffect, useState } from "react";
import { createUseStyles } from "react-jss";
import AuthenticationStore from "../../stores/authentication";
import NavigationStore from "../../stores/navigation";
import LinkEntry from "./components/linkEntry";
import request, { getFullUrl } from "../../lib/request";

const DiscordLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 127.14 96.36"
    fill="white"
    style={{ flexShrink: 0 }}
  >
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const useNavSideBarStyles = createUseStyles({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  card: {
    width: '175px',
    background: '#252525',
    height: '100vh',
    paddingLeft: '10px',
    paddingRight: '10px',
    color: '#ffffff',
  },
  userWrapper: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '8px',
    paddingBottom: '5px',
    textDecoration: 'none',
    '&:hover': {
      opacity: 0.8,
    }
  },
  headshot: {
    width: '32px',
    height: '32px',
    marginRight: '8px',
    borderRadius: '50%',
    backgroundColor: '#3d3d3d',
    flexShrink: 0,
    objectFit: 'cover',
    boxShadow: 'rgba(25, 25, 25, 0.3) 0px 1px 4px 0px',
  },
  username: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  divider: {
    borderBottom: '2px solid #c3c3c3',
    height: '2px',
    width: '100%',
    marginBottom: '5px',
  },
  upgradeNowButton: {
    marginTop: '10px',
    background: '#01a2fd',
    fontSize: '15px',
    fontWeight: 500,
    width: '100%',
    paddingTop: '8px',
    paddingBottom: '8px',
    textAlign: 'center',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    display: 'block',
    '&:hover': {
      background: '#3ab8ff',
    },
  },
  discordButton: {
    marginTop: '6px',
    marginBottom: '10px',
    background: '#5865F2',
    width: '100%',
    paddingTop: '5px',
    paddingBottom: '5px',
    paddingLeft: '8px',
    paddingRight: '8px',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    gap: '5px',
    '&:hover': {
      background: '#4752c4',
    },
  },
  discordText: {
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
});

const NavSideBar = props => {
  const authStore = AuthenticationStore.useContainer();
  const navStore = NavigationStore.useContainer();
  const mainNavBarRef = props.mainNavBarRef;
  const [dimensions, setDimensions] = useState({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0
  });
  const [userData, setUserData] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const s = useNavSideBarStyles();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth
      });
    };

    window.addEventListener('resize', handleResize);

    const getStaffData = async () => {
      try {
        const response = await request('GET', getFullUrl('users', '/v1/users/authenticated'));
        setUserData(response.data);

        if (response.data.isStaff) {
          const [pendingIcons, pendingAssets, pendingGroupIcons] = await Promise.all([
            request('GET', `/admin-api/api/icons/pending-assets`),
            request('GET', `/admin-api/api/assets/pending-assets`),
            request('GET', `/admin-api/api/groups/pending-icons`)
          ]);

          let count = 0;
          if (pendingIcons.data) count += pendingIcons.data.length;
          if (pendingAssets.data) count += pendingAssets.data.length;
          if (pendingGroupIcons.data) count += pendingGroupIcons.data.length;

          setPendingCount(count);
        }
      } catch (error) { }
    };

    getStaffData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const paddingTop = (mainNavBarRef?.current && mainNavBarRef.current.clientHeight + 'px') || '40px';

  const isDesktop = dimensions.width > 1300;

  if (!isDesktop && navStore.isSidebarOpen === false) {
    return null;
  }

  return (
    <div className={s.container}>
      <div className={s.card} style={{ paddingTop }}>
        <a href={'/users/' + authStore.userId + '/profile'} className={s.userWrapper}>
          <img
            className={s.headshot}
            src={`/thumbs/avatar-headshot.ashx?userId=${authStore.userId}&width=48&height=48&v=${Date.now()}`}
            alt="User"
          />
          <p className={s.username}>{authStore.username}</p>
        </a>
        <div className={s.divider} />
        <LinkEntry name='Home' url='/home' icon='icon-nav-home' />
        <LinkEntry name='Profile' url={'/users/' + authStore.userId + '/profile'} icon='icon-nav-profile' />
        <LinkEntry name='Messages' url='/My/Messages' icon='icon-nav-message' count={authStore.notificationCount.messages} />
        <LinkEntry name='Friends' url={'/users/' + authStore.userId + '/friends'} icon='icon-nav-friends' count={authStore.notificationCount.friendRequests} />
        <LinkEntry name='Avatar' url='/My/Avatar' icon='icon-nav-charactercustomizer' />
        <LinkEntry name='Inventory' url={'/users/' + authStore.userId + '/inventory'} icon='icon-nav-inventory' />
        <LinkEntry name='Trade' url='/My/Trades.aspx' icon='icon-nav-trade' count={authStore.notificationCount.trades} />
        <LinkEntry name='Groups' url='/My/Groups.aspx' icon='icon-nav-group' />
        {userData?.isStaff && <LinkEntry name='Admin Panel' url='/admin' icon='icon-nav-settings' count={pendingCount} />}
        <LinkEntry name='Promocodes' url='/promocodes' icon='icon-nav-forum' />
        <a href='/BuildersClub/Upgrade.ashx' className={s.upgradeNowButton}>Upgrade Now</a>
        <a href='https://discord.gg/athera' className={s.discordButton} target='_blank' rel='noopener noreferrer'>
          <DiscordLogo />
          <span className={s.discordText}>Discord Server</span>
        </a>
      </div>
    </div>
  );
};

export default NavSideBar;