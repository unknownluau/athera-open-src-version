import React, { useEffect } from "react";
import { createUseStyles } from "react-jss";
import AuthenticationStore from "../../stores/authentication";
import GearDropdown from "../gearDropdown";
import OldVerticalTabs from "../oldVerticalTabs";
import ReportAbuse from "../reportAbuse";
import BuyButton from "./components/buyButton";
import BuyItemModal from "./components/buyItemModal";
import Comments from "./components/comments";
import CreatorLink from "../creatorLink";
import DelistItemModal from "./components/delistItemModal";
import Genres from "./components/genres";
import ItemImage from "../itemImage";
import { LimitedOverlay, LimitedUniqueOverlay } from "./components/limitedOverlay";
import Link from "../link";
import Recommendations from "./components/recommendations";
import Resellers from "./components/resellers";
import SaleHistory from "./components/saleHistory";
import SellItemModal from "./components/sellItemModal";
import CatalogDetailsPage from "./stores/catalogDetailsPage";
import AdBanner from "../ad/adBanner";
import AdSkyscraper from "../ad/adSkyscraper";
import { addOrRemoveFromCollections } from "../../services/catalog";
import { getCollections } from "../../services/inventory";
import getFlag from "../../lib/getFlag";
import Owners from "./components/owners";
import Favorite from "./components/favorite";
import AudioPlayer from "./components/audioPlayer";
import { Thumbnail3DHandler } from "../thumbnail3D";
import ActionButton from "../actionButton";
import request from "../../lib/request";
import useButtonStyles from "../../styles/buttonStyles";

const emptyDescriptionMessage = 'No description available.';
const filterTextForEmpty = str => {
  if (!str) return emptyDescriptionMessage;
  if (str.trim().length === 0) {
    return emptyDescriptionMessage;
  }
  if (!str.match(/[a-z0-9A-Z]+/g)) {
    return emptyDescriptionMessage;
  }
  return str;
}

const useStyles = createUseStyles({
  title: {
    fontWeight: 700,
    fontSize: '28px',
    color: '#343434',
    marginBottom: '2px',
  },
  subtitle: {
    fontWeight: 500,
    fontSize: '20px',
    color: '#343434',
    marginBottom: 0,
  },
  description: {
    marginBottom: 0,
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
  },
  catalogItemContainer: {
    background: '#fff',
    padding: '10px 15px',
    overflow: 'hidden',
    position: 'relative',
  },
  detailsTable: {
    width: '100%',
    fontSize: '18px',
    '& td': {
      padding: '8px 0',
      verticalAlign: 'middle',
    },
  },
  dotsWrapper: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    zIndex: 10,
  },
  dotsButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#000',
    padding: '0 5px',
    lineHeight: 1,
    letterSpacing: '1px',
    fontWeight: 900,
    '&:hover': {
      color: '#333',
    },
    '&:before': {
      content: '"\\25AA\\25AA\\25AA"',
      fontSize: '14px',
      verticalAlign: 'middle',
    }
  },
  abuseMenu: {
    position: 'absolute',
    top: '30px',
    right: 0,
    background: '#fff',
    border: '1px solid #ccc',
    padding: '0',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    borderRadius: '4px',
    minWidth: '150px',
    '& ul': {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    '& li': {
      padding: '8px 12px',
      fontSize: '14px',
      color: '#343434',
      cursor: 'pointer',
      textAlign: 'left',
      '&:hover': {
        background: '#f2f2f2',
      },
      '& a': {
        color: '#343434',
        textDecoration: 'none !important',
        display: 'block',
        width: '100%',
      }
    }
  },
  detailsLabel: {
    color: '#666',
    width: '120px',
  },
  detailsValue: {
    color: '#333',
    fontWeight: 500,
  },
  creatorLabel: {
    fontSize: '20px',
    color: '#666',
    marginRight: '4px',
  },
  itemOwnedWrapper: {
    display: 'flex',
    alignItems: 'center',
    margin: '2px 0 8px 0',
  },
  itemOwnedIcon: {
    backgroundColor: '#02b757',
    color: '#fff',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '6px',
    fontSize: '11px',
    fontWeight: 700,
    '&:before': {
      content: '"\\2713"',
    },
  },
  itemOwnedText: {
    fontSize: '13px',
    color: '#343434',
    fontWeight: 500,
  },
  thumbnail3DButtonContainer: {
    display: "flex",
    position: "absolute",
    bottom: 10,
    right: 10,
    zIndex: 3,
  },
  thumbnail3DButton: {
    color: 'black!important',
    padding: 9,
    fontSize: "18px!important",
    lineHeight: "100%!important",
    minHeight: 32,
  },

})

/**
 * CatalogDetails page
 * @param {{details: any}} props
 * @returns 
 */
const CatalogDetails = props => {
  const { details } = props;
  const authStore = AuthenticationStore.useContainer();
  const s = useStyles();
  const buttonStyles = useButtonStyles();
  const isLimited = details.itemRestrictions.includes('Limited');
  const isLimitedUnique = details.itemRestrictions.includes('LimitedUnique');
  const store = CatalogDetailsPage.useContainer();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const canvasParentRef = React.useRef(null);
  const [thumbnail3D] = React.useState(new Thumbnail3DHandler());
  const [is3DReady, set3DReady] = React.useState(false);
  const [isRendering3D, setRendering3D] = React.useState(false);
  const [is3dMode, setIs3dMode] = React.useState(false);

  useEffect(() => {
    return () => {
      thumbnail3D.Dispose();
    }
  }, []);

  const toggle3D = async (e) => {
    e.preventDefault();
    if (is3dMode) {
      setIs3dMode(false);
      thumbnail3D.Stop();
    } else {
      setIs3dMode(true);
      setRendering3D(true);
      try {
        const result = await request('GET', `/apisite/thumbnails/v1/assets/thumbnail-3d?assetIds=${details.id}`);
        if (result.data && result.data.data && result.data.data[0] && result.data.data[0].imageUrl) {
          const jsonBlobUrl = result.data.data[0].imageUrl;
          const blobResponse = await fetch(jsonBlobUrl);
          if (blobResponse.status !== 200) throw new Error("JSON Fetch failed");
          const jsonVal = await blobResponse.json();
          if (jsonVal && canvasParentRef.current) {
            thumbnail3D.LoadThumbnail(jsonVal, canvasParentRef.current, set3DReady);
          } else {
            console.error("Null json or missing parent");
            setIs3dMode(false);
          }
        } else {
          setIs3dMode(false);
        }
      } catch (err) {
        console.error("Error loading 3D:", err);
        setIs3dMode(false);
      } finally {
        setRendering3D(false);
      }
    }
  };

  useEffect(() => {
    store.setDetails(props.details);
    if (props.details.saleCount) {
      store.setSaleCount(props.details.saleCount);
    } else {
      store.setSaleCount(0);
    }
    if (props.details.offsaleDeadline) {
      store.setOffsaleDeadline(props.details.offsaleDeadline);
    } else {
      store.setOffsaleDeadline(null);
    }
  }, [props]);

  useEffect(() => {
    if (!authStore.userId || !store.details) {
      return;
    }
    store.loadOwnedCopies(authStore.userId);
    if (store.isResellable) {
      store.loadResellers();
    }
    getCollections({
      userId: authStore.userId,
    }).then(col => {
      let inCollection = col.find(v => {
        return v.Id === store.details.id;
      });
      store.setInCollection(inCollection !== undefined);
    })
  }, [store.details, authStore.userId]);

  const hasItemToDeList = store.isResellable && store.allResellers && store.allResellers.find(v => v.seller.id === authStore.userId) !== undefined;
  const hasItemToSell = store.isResellable && store.ownedCopies && store.ownedCopies.filter(v => v.price === null || v.price === 0).length > 0;
  const isCreator = store.details && store.details.creatorType === 'User' && store.details.creatorTargetId == authStore.userId; // todo: group support
  const showGear = hasItemToDeList ||
    hasItemToSell ||
    isCreator ||
    (store.ownedCopies && store.ownedCopies.length > 0) // Collection stuff

  if (!store.details) return null;

  return <div className='container'>
    <AdBanner />
    <div className={s.catalogItemContainer}>
      <div className={s.dotsWrapper}>
        <button className={s.dotsButton} onClick={() => setMenuOpen(!menuOpen)} />
        {menuOpen && (
          <div className={s.abuseMenu}>
            <ul>
              {hasItemToDeList && (
                <li onClick={() => { setMenuOpen(false); store.setUnlistModalOpen(true); }}>Take Off Sale</li>
              )}
              {hasItemToSell && (
                <li onClick={() => { setMenuOpen(false); store.setResaleModalOpen(true); }}>Sell Item</li>
              )}
              {isCreator && (
                <li>
                  <Link href={'/My/Item.aspx?id=' + props.details.id}>
                    <a>Configure</a>
                  </Link>
                </li>
              )}
              {isCreator && (
                <li>
                  <Link href={'/My/CreateUserAd.aspx?targetId=' + props.details.id + '&targetType=asset'}>
                    <a>Advertise</a>
                  </Link>
                </li>
              )}
              {store.ownedCopies && store.ownedCopies.length > 0 && (
                <li onClick={() => {
                  setMenuOpen(false);
                  const newInCollection = !store.inCollection;
                  store.setInCollection(newInCollection);
                  addOrRemoveFromCollections({
                    assetId: store.details.id,
                    addToProfile: newInCollection,
                  });
                }}>
                  {store.inCollection ? 'Remove From Collection' : 'Add To Collection'}
                </li>
              )}
              <li>
                <a href={`/abusereport/asset?id=${details.id}&RedirectUrl=${encodeURIComponent(window.location.href)}`}>
                  Report Item
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
      <BuyItemModal />
      <SellItemModal />
      <DelistItemModal />
      <div className='row mt-4'>
        <div className='col-12 col-lg-10'>
          <div className='row'>
            <div className='col-12 col-md-6 mb-4'>
              <div style={{ position: 'relative', display: 'table', margin: '0 auto', width: '352px', height: '352px' }}>
                <div style={{ display: is3dMode ? 'none' : 'block' }}>
                  <ItemImage id={details.id} name={details.name} />
                </div>
                <div ref={canvasParentRef} style={{ display: is3dMode ? 'block' : 'none', width: '352px', height: '352px', position: 'relative', overflow: 'hidden' }}>
                  {is3dMode && !is3DReady && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', zIndex: 1, borderRadius: '4px' }}>
                      <span className="spinner" style={{ height: "100%", backgroundSize: "auto 36px" }} />
                    </div>
                  )}
                </div>
                {store.details.assetType === 3 ? <AudioPlayer audioId={details.id} /> : null}
                {(isLimitedUnique && <LimitedUniqueOverlay />) || (isLimited && <LimitedOverlay />) || null}
                <div className={s.thumbnail3DButtonContainer}>
                  <ActionButton
                    className={s.thumbnail3DButton}
                    buttonStyle={buttonStyles.newCancelButton}
                    disabled={isRendering3D}
                    onClick={toggle3D}
                    label={is3dMode ? "2D" : "3D"}
                  />
                </div>
              </div>
            </div>
            <div className='col-12 col-md-6'>
              <div className='d-flex justify-content-between align-items-start'>
                <div>
                  <h1 className={s.title}>{details.name}</h1>
                  {store.ownedCopies && store.ownedCopies.length > 0 && (
                    <div className={s.itemOwnedWrapper}>
                      <span className={s.itemOwnedIcon} />
                      <span className={s.itemOwnedText}>Item Owned</span>
                    </div>
                  )}
                  <p className={s.subtitle}>
                    <span className={s.creatorLabel}>By:</span>
                    <CreatorLink id={details.creatorTargetId} name={details.creatorName} type={details.creatorType} />
                  </p>
                </div>
                {/* Cog icon dropdown removed and consolidated into 3-dots menu */}
              </div>
              <div className='divider-top mt-2 mb-3' />
              <table className={s.detailsTable}>
                <tbody>
                  <tr>
                    <td className={s.detailsLabel}>Price</td>
                    <td className={s.detailsValue}>
                      <BuyButton />
                    </td>
                  </tr>
                  <tr>
                    <td className={s.detailsLabel}>Type</td>
                    <td className={s.detailsValue}>{store.subCategoryDisplayName}</td>
                  </tr>
                  <tr>
                    <td className={s.detailsLabel}>Sales</td>
                    <td className={s.detailsValue}>{store.saleCount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className={s.detailsLabel}>Genres</td>
                    <td className={s.detailsValue}>
                      <Genres genres={details.genres} />
                    </td>
                  </tr>
                  <tr>
                    <td className={s.detailsLabel}>Description</td>
                    <td className={s.detailsValue}>
                      <p className={s.description}>{filterTextForEmpty(details.description)}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className='mt-4'>
                <div className='mt-2'>
                  <Favorite assetId={details.id} favoriteCount={details.favoriteCount} />
                </div>
              </div>
            </div>
          </div>
          {store.isResellable &&
            <div className='row'>
              <div className='col-12'>
                <div className='divider-top mt-2' />
              </div>
              <div className='col-6'>
                <Resellers />
              </div>
              <div className='col-6'>
                <SaleHistory />
              </div>
            </div>
          }
          <div className='row'>
            <div className='col-12 mt-4'>
              <OldVerticalTabs options={[
                {
                  name: 'Recommendations',
                  element: <Recommendations assetId={details.id} assetType={details.assetType} />,
                },
                {
                  name: 'Commentary',
                  element: <Comments assetId={details.id} />
                },
                (isLimited || isLimitedUnique) && getFlag('catalogDetailsPageOwnersTabEnabled', false) && {
                  name: 'Owners',
                  element: <Owners assetId={details.id} />,
                },
              ].filter(v => !!v)} />
            </div>
          </div>
        </div>
        <div className='col-12 col-lg-2'>
          <AdSkyscraper />
        </div>
      </div>
    </div>
  </div>
}

export default CatalogDetails;