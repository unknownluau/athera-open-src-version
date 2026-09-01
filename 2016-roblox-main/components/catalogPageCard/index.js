import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { createUseStyles } from "react-jss";
import getFlag from "../../lib/getFlag";
import { getBaseUrl } from "../../lib/request";
import { getItemUrl, itemNameToEncodedName } from "../../services/catalog";
import LimitedOverlay from "../catalogOverlays/limited";
import LimitedUniqueOverlay from "../catalogOverlays/limitedUnique";
import NewOverlay from "../catalogOverlays/new";
import SaleOverlay from "../catalogOverlays/sale";
import TimerOverlay from "../catalogOverlays/timer";
import CreatorLink from "../creatorLink";
import Robux from "../robux";
import thumbnailStore from "../../stores/thumbnailStore";
import Link from "../link";
import Tickets from "../tickets";

const useCatalogPageStyles = createUseStyles({
  image: {
    width: '100%',
    height: '180px',
    objectFit: 'contain',
    margin: '0 auto',
    display: 'block',
  },
  divider: {
    width: '100%',
    height: '1px',
    background: '#e3e3e3',
    margin: '4px auto',
  },
  imageWrapper: {
    maxWidth: '200px',
    display: 'block',
    margin: '0 auto',
  },
  detailsLarge: {

  },
  detailsSmall: {

  },
  detailsWrapper: {
    position: 'absolute',
    display: 'none',
    background: '#fff',
    paddingBottom: '5px',
    border: '1px solid #c3c3c3',
    transform: 'scale(110%)',
    zIndex: 2,
    paddingLeft: '4px',
  },
  detailsOpen: {
    display: 'block',
    marginTop: '-10px',
  },
  detailsKey: {
    fontSize: '10px',
    marginLeft: '0',
    marginRight: '2px',
    opacity: 0.7,
    fontWeight: 600,
  },
  detailsValue: {
    fontSize: '10px',
  },
  detailsEntry: {
    marginBottom: 0,
    marginTop: '-5px',
  },
  overviewDetails: {

  },
  card: {
    background: '#fff',
    padding: '8px',
    border: '1px solid #e3e3e3',
    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.1)',
    transition: 'none',
    borderRadius: '5px',
  },
  itemName: {
    overflow: 'hidden',
    color: '#000',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
    height: '32px',
    marginBottom: '4px',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    '&:hover': {
      textDecoration: 'none',
      color: '#000',
    },
  },
});

const usePriceStyles = createUseStyles({
  priceContainer: {
    height: '38px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  remainingText: {
    fontWeight: 700,
    fontSize: '12px',
  },
  remainingLabel: {
    color: 'red',
    fontWeight: 600,
    fontSize: '12px',
  },
  originalPrice: {
    color: '#757575',
  }
})

const PriceText = (props) => {
  const s = usePriceStyles();
  const isLimited = props.itemRestrictions && (props.itemRestrictions.includes('Limited') || props.itemRestrictions.includes('LimitedUnique'));
  const copiesRemaining = props.unitsAvailableForConsumption;

  let priceElements = [];
  if (props.isForSale) {
    if (props.price === 0) {
      priceElements.push(<p className='mb-0 text-dark'>Free</p>)
    } else if (props.price !== null) {
      priceElements.push(<p className='mb-0'><Robux>{props.price}</Robux></p>)
    }
    // If item is free, why would anyone pay in tickets?
    if (props.priceTickets !== null && props.price !== 0) {
      priceElements.push(<p className='mb-0'><Tickets>{props.priceTickets}</Tickets></p>)
    }
  }

  const renderContent = () => {
    if (props.isForSale && props.price !== 0 && props.price !== null) {
      if (copiesRemaining) {
        return <div>
          <>{priceElements.map((v, i) => <React.Fragment key={i}>{v}</React.Fragment>)}</>
          <span>
            <span className={s.remainingLabel}>Remaining: </span> <span className={s.remainingText + ' text-dark'}>{copiesRemaining.toLocaleString()}</span>
          </span>
        </div>
      }
      return <>{priceElements.map((v, i) => <React.Fragment key={i}>{v}</React.Fragment>)}</>
    }
    if (props.isForSale && (props.price === 0 || props.price === null)) {
      return <>{priceElements.map((v, i) => <React.Fragment key={i}>{v}</React.Fragment>)}</>
    }
    if (isLimited && !props.isForSale) {
      // Limited and not for sale anymore
      return <div>
        <p className='mb-0'><Robux prefix="Was " prefixClassName={s.originalPrice} icon="/img/was_robux.png" className={s.originalPrice}>{props.price || '-'}</Robux></p>
        <p className='mb-0'><Robux prefix="">{props.lowestPrice || '-'}</Robux></p>
      </div>
    }
    return <p className='mb-0 text-dark'>offsale</p>;
  }

  return <div className={s.priceContainer}>{renderContent()}</div>
}

const CatalogPageCard = props => {
  const s = useCatalogPageStyles();
  const c = 'col-6 col-sm-4 col-md-4 col-lg-3 mb-3';
  const thumbs = thumbnailStore.useContainer();

  const [image, setImage] = useState(thumbs.getPlaceholder());
  useEffect(() => {
    setImage(thumbs.getAssetThumbnail(props.id));
  }, [props, thumbs.thumbnails]);

  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef(null);
  // various conditionals
  const isLimited = props.itemRestrictions && props.itemRestrictions.includes('Limited');
  const isLimitedU = props.itemRestrictions && props.itemRestrictions.includes('LimitedUnique');
  const hasBottomOverlay = isLimited || isLimitedU;

  const isTimedItem = props.isForSale && props.offsaleDeadline;
  const isNew = props.createdAt ? dayjs(props.createdAt).isAfter(dayjs().subtract(2, 'days')) : false;
  const isSale = false; // TODO
  const hasTopOverlay = isNew || isSale;

  return <div className={`${c}`}>
    <div ref={cardRef} className={`${s.imageWrapper} ${s.card}`} >
      <Link href={getItemUrl({ assetId: props.id, name: props.name })}>
        <a>
          <div style={{ position: 'relative' }}>
            {isTimedItem ? <TimerOverlay /> : null}
            {isNew ? <NewOverlay /> : isSale ? <SaleOverlay /> : null}
            <img alt={props.name} src={image} className={`${s.image}`} onError={e => {
              if (e.currentTarget.src !== thumbs.getPlaceholder()) {
                setImage(thumbs.getPlaceholder());
              }
            }} />
            {isLimited ? <LimitedOverlay /> : null}
            {isLimitedU ? <LimitedUniqueOverlay /> : null}
            <div className={s.overviewDetails} style={hasBottomOverlay ? { marginTop: '-18px' } : undefined}>
              <div className={s.divider} />
              <p className={`mb-0 ${s.itemName}`}>{props.name}</p>
              <PriceText {...props} />
            </div>
          </div>
        </a>
      </Link>
    </div>
  </div>
}

export default CatalogPageCard;