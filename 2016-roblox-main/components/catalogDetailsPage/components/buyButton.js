import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import AuthenticationStore from "../../../stores/authentication";
import ActionButton from "../../actionButton";
import Tickets from "../../tickets";
import CatalogDetailsPage from "../stores/catalogDetailsPage";
import CatalogDetailsPageModal from "../stores/catalogDetailsPageModal";
import BuyItemModal from "./buyItemModal";
import Robux from "./robux";
import OffsaleDeadline from "./offsaleDeadline";

const useBestPriceStyles = createUseStyles({
  text: {
    fontSize: '14px',
    marginBottom: '4px',
    textAlign: 'center',
    marginTop: '4px',
  },
  noSellers: {
    textAlign: 'center',
    marginTop: '30px',
    marginBottom: '30px',
  },
});

const BestPriceEntry = props => {
  const s = useBestPriceStyles();
  const store = CatalogDetailsPage.useContainer();
  const lowestSeller = store.getPurchaseDetails();
  if (!lowestSeller) {
    return <p className={s.noSellers}> No one is currently selling this item. </p>
  }
  const lowestPrice = lowestSeller.price;
  return <p className={s.text}>
    <Robux prefix="Best Price: " hideIcon={true}>{lowestPrice}</Robux>
  </p>
}

const useBuyButtonStyles = createUseStyles({
  buttonWide: {
    width: '180px',
    height: '50px',
    fontSize: '21px',
    padding: '15px',
    textAlign: 'center',
    fontWeight: 500,
    lineHeight: '100%',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#02b757',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#3fc679',
    },
    '&:disabled': {
      backgroundColor: '#84d684',
      cursor: 'not-allowed',
    }
  },
  priceText: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    padding: '0 10px',
    marginBottom: 0,
    width: '100%',
    textAlign: 'center',
    fontSize: '12px',
    color: '#666',
  },
});

const PrivateSellersCount = props => {
  const store = CatalogDetailsPage.useContainer();
  return <p className='mt-0 mb-0 text-center'>
    <a className='a'>See all private sellers ({store.resellersCount || 0})</a>
  </p>
}

const useSaleCountStyles = createUseStyles({
  text: {
    color: '#666',
    fontSize: '12px',
  }
})

const SaleCount = props => {
  const store = CatalogDetailsPage.useContainer();
  const s = useSaleCountStyles();
  const statusText = store.details?.assetType === 21 ? 'Awarded' : 'Sold';
  console.log('type:', store.details?.assetType);
  console.log('sales:', store.saleCount);

  return (
    <p className={'mt-2 mb-2 text-center ' + s.text}>
      ( <span className='text-black'>{store.saleCount}</span> {statusText})
    </p>
  );
}

const OwnedCount = props => {
  const store = CatalogDetailsPage.useContainer();
  const s = useSaleCountStyles();
  if (!store.ownedCopies || store.ownedCopies.length === 0) return null;
  return <p className={'mt-2 mb-0 text-center ' + s.text}>
    ( <span className='text-black'>{store.ownedCopies.length}</span> Owned)
  </p>
}

const useTicketPriceStyles = createUseStyles({
  ticketPrice: {
    width: '100%',
    height: '23px',
    fontSize: '20px',
  },
});

const PriceTickets = props => {
  const s = useTicketPriceStyles();
  const store = CatalogDetailsPage.useContainer();

  return <div className={s.ticketPrice}>
    <span>Price: </span><Tickets hideIcon={true}>{store.details.priceTickets}</Tickets>
  </div>
}

const BuyAction = props => {
  const s = useBuyButtonStyles();
  const currency = props.currency; // 1 = Robux, 2 = Tickets
  const store = CatalogDetailsPage.useContainer();
  const authenticationStore = AuthenticationStore.useContainer();
  const modalStore = CatalogDetailsPageModal.useContainer();
  const productInfo = store.getPurchaseDetails();
  const auth = AuthenticationStore.useContainer();

  if (store.ownedCopies === null) return null;
  const isOwned = store.ownedCopies.length !== 0;
  const isResaleItem = store.isResellable;
  const showPriceText = store.details.isForSale || (isResaleItem && productInfo);
  const isDisabled = !store.isResellable && !store.details.isForSale ||
    (isOwned && !store.isResellable) ||
    (store.isResellable && !productInfo);
  const isFree = !isDisabled && productInfo && productInfo.price === 0;

  const tooltipTitle = isOwned ? 'You already own this item.' : 'This item is not for sale';
  const actionBuyText = (() => {
    if (isFree && !isResaleItem)
      return 'Get';

    if (currency === 2) {
      return 'Buy with Tx';
    }
    return 'Buy';
  })();

  if (store.isResellable) {
    if (!store.allResellers || store.allResellers.length === 0) {
      return null;
    }
  }

  return <div className="d-flex justify-content-between align-items-center w-100">
    <div className={s.priceText}>
      {showPriceText && productInfo && (
        currency === 1 ? <Robux hideIcon={false}>{isFree ? 'Free' : productInfo.price}</Robux> :
          <PriceTickets />
      )}
    </div>
    <div style={{ width: '200px' }}>
      <ActionButton
        onClick={(e) => {
          modalStore.openPurchaseModal(store.getPurchaseDetails(), auth.robux, auth.tix, currency);
        }}
        label={actionBuyText}
        disabled={isDisabled}
        tooltipText={tooltipTitle}
        className={s.buttonWide}
      />
    </div>
  </div>
}

const useOrTabStyles = createUseStyles({
  label: {
    padding: '0 10px',
    marginBottom: 0,
    width: 'width',
    textAlign: 'center',
  },
});

const PurchaseWithRobuxOrTicketsLabel = props => {
  const s = useBuyButtonStyles();
  return <div className="border-bottom border-gray-400 mb-2 mt-2" style={{ borderBottom: '1px solid #ccc' }}>
    <p className={s.label}>
      <span style={{ position: 'relative', top: '10px', background: '#fff', padding: '0 10px' }}>OR</span>
    </p>
  </div>
}

/**
 * The purchase button
 * @param {*} props 
 */
const BuyButton = props => {
  const store = CatalogDetailsPage.useContainer();
  const isResellAsset = store.isResellable;
  const showBuyButton = (() => {
    if (isResellAsset) return true;
    return store.details.price !== null;
  })();
  const showBuyTicketsButton = store.details.priceTickets !== null && !isResellAsset;

  return <div className="w-100">
    {showBuyButton && <BuyAction currency={1} />}
    {showBuyTicketsButton && (
      <div className="mt-2">
        <BuyAction currency={2} />
      </div>
    )}
  </div>
}

export default BuyButton;