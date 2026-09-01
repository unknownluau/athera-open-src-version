// reference: https://web.archive.org/web/20150228101148mp_/http://www.roblox.com/Work-at-a-Pizza-Place-place?id=192800
import React, { useEffect } from "react";
import { createUseStyles } from "react-jss";
import AdBanner from "../ad/adBanner";
import AdSkyscraper from "../ad/adSkyscraper";
import Comments from "../catalogDetailsPage/components/comments";
import Recommendations from "../catalogDetailsPage/components/recommendations";
import Badges from "../catalogDetailsPage/components/badges";
import Passess from "../catalogDetailsPage/components/passess";
import OldVerticalTabs from "../oldVerticalTabs";
import GameOverview from "./components/gameOverview";
import GameServers from "./components/gameServers";
import Description from "./components/description";
import GameStats from "./components/gameStats";
import GameDetailsStore from "./stores/gameDetailsStore"

const useStyles = createUseStyles({
  outerContainer: {
    maxWidth: '850px !important',
    margin: '0 auto',
  },
  whiteBox: {
    backgroundColor: '#fff',
    padding: '12px 15px',
    overflow: 'hidden',
    borderRadius: '4px',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid #c3c3c3',
    marginBottom: '15px',
    width: '100%',
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    padding: '8px 0',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666',
    '&:hover': {
      color: '#333',
    }
  },
  activeTab: {
    color: '#00a2ff',
    borderBottom: '3px solid #00a2ff',
    marginBottom: '-1px',
    fontWeight: 500,
    '&:hover': {
      color: '#00a2ff',
    }
  },
  tabContent: {
    padding: '0 15px',
  },
  sectionHeader: {
    color: '#757575',
    fontSize: '20px',
    fontWeight: 400,
    marginBottom: '8px',
    marginTop: '10px',
  },
  sectionSeparator: {
    height: '1px',
    backgroundColor: '#c3c3c3',
    width: '100%',
    marginBottom: '15px',
  },
})

const GameDetails = props => {
  const { details } = props;
  const s = useStyles();
  const [activeTab, setActiveTab] = React.useState('About');

  const store = GameDetailsStore.useContainer();
  useEffect(() => {
    store.setDetails(details);
  }, [props]);

  if (!store.details) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'About':
        return <div>
          <Description></Description>
          <div className='mt-3'>
            <GameStats />
          </div>
          <div className='mt-4'>
            <Recommendations assetId={details.id} assetType={9}></Recommendations>
          </div>
          <div className='mt-4'>
            <Comments assetId={details.id}></Comments>
          </div>
        </div>
      case 'Store':
        return <div>
          <h3 className={s.sectionHeader}>Store</h3>
          <div className={s.sectionSeparator} />
          <Passess assetId={details.id} assetType={34}></Passess>
          <div className='mt-4'>
            <h3 className={s.sectionHeader}>Badges</h3>
            <div className={s.sectionSeparator} />
            <Badges assetId={details.id} assetType={21}></Badges>
          </div>
        </div>
      case 'Servers':
        return <GameServers></GameServers>
      default:
        return null;
    }
  }

  return <div className={`container ${s.outerContainer}`}>
    <AdBanner></AdBanner>
    <div className={s.whiteBox}>
      <GameOverview></GameOverview>
    </div>

    <div className={`${s.whiteBox} mt-3`}>
      <div className={s.tabContainer}>
        {['About', 'Store', 'Servers'].map(t => (
          <div
            key={t}
            className={`${s.tab} ${activeTab === t ? s.activeTab : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </div>
        ))}
      </div>
      <div className='row'>
        <div className={`col-12 ${s.tabContent}`}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  </div>
}

export default GameDetails;