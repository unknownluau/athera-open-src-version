import ExchangeStore from "../stores/exchangeStore";
import OldModal from "../../../../oldModal";
import {useEffect, useState} from "react";
import Tickets from "../../../../tickets";
import Robux from "../../../../robux";
import ActionButton from "../../../../actionButton";
import {createCurrencyExchangeOrder, createCurrencyExchangeOrderREAL} from "../../../../../services/economy";
import useButtonStyles from "../../../../../styles/buttonStyles";

const NewPositionModal = props => {
  const store = ExchangeStore.useContainer();
  const btnStyles = useButtonStyles();
  const [isMarketOrder, setIsMarketOrder] = useState(true);
/*   const [rate, setRate] = useState(0); */
  const [amount, setAmount] = useState(''); 
  const [currency, setCurrency] = useState(2);
  const [amountWanted, setAmountWanted] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  // why does this keep getting set to NaN?
  //  idk tbh so just hard code for now
  const rate = currency === 1 ? 10 : 0.1;
/*   useEffect(() => {
    let amtInt = parseInt(amount, 10);
    let rawRate = amountWanted / amtInt;
    if (rawRate !== 0)
      setRate(rawRate);
  }, [amount, amountWanted, currency]);

  useEffect(() => {
    if (isMarketOrder && store.statistics) {
      // market average is too small to be useful right now, just use hard coded
      const averageRate = currency === 1 ? 10 : 0.1;
      console.log('avg rate', averageRate);
      setRate(averageRate);
    }
  }, [store.statistics, isMarketOrder, currency]);
  */
  
  if (!store.newPositionVisible)
    return null;

  console.log('amt', amount, 'at rate', rate);
  const estimatedReturn = amount ? Math.trunc(parseInt(amount, 10) * rate) : 0;

  return <OldModal title={store.isConvertMode ? 'Convert Currency' : 'Trade Currency'}>
    <table className='w-100'>
      <tbody>
        {!store.isConvertMode && (
          <tr>
            <td className='text-end fw-bolder pe-2'>Trade Type:</td>
            <td>
              <div className='d-inline-block'>
                <input disabled={locked} type='radio' checked={isMarketOrder} onChange={(e) => {
                  setIsMarketOrder(true);
                  setFeedback(null);
                }} />
              </div>
              <div className='d-inline-block pe-2'>
                Market Order
              </div>
              <div className='d-inline-block'>
                <input disabled={locked} type='radio' checked={!isMarketOrder} onChange={(e) => {
                  setIsMarketOrder(false);
                  setFeedback(null);
                }} />
              </div>
              <div className='d-inline-block'>
                Limit Order
              </div>
            </td>
          </tr>
        )}
        {store.isConvertMode && (
          <tr>
            <td className='text-end fw-bolder pe-2'>Convert Type:</td>
            <td>
              <div className='d-inline-block'>
                <input disabled={locked} type='radio' checked={isMarketOrder} onChange={(e) => {
                  setIsMarketOrder(true);
                  setFeedback(null);
                }} />
              </div>
              <div className='d-inline-block pe-2'>
                Convert
              </div>
            </td>
          </tr>
        )}
        <tr>
          <td className={'text-end fw-bolder pe-2'}>What I'll give</td>
          <td>
            <input disabled={locked} type='text' value={amount} onChange={(e) => {
              setAmount(e.currentTarget.value);
              setFeedback(null);
            }} />
            <select disabled={locked} value={currency} onChange={(v) => {
              setCurrency(parseInt(v.currentTarget.value, 10));
            }}>
              <option value={1}>Robux</option>
              <option value={2}>Tickets</option>
            </select>
          </td>
        </tr>
        {
          store.isConvertMode || isMarketOrder ? (
            <tr>
              <td className={'text-end fw-bolder pe-2'}>What I'll get</td>
              <td>
                {feedback ? null : (currency === 1 ? <Tickets>{estimatedReturn ? estimatedReturn : '-'}</Tickets> : <Robux>{estimatedReturn ? estimatedReturn : '-'}</Robux>)}
              </td>
            </tr>
          ) : (
            <tr>
              <td className={'text-end fw-bolder pe-2'}>What I want</td>
              <td>
                <input disabled={locked} value={amountWanted} type='text' onChange={(e) => {
                  let num = parseInt(e.currentTarget.value, 10);
                  setAmountWanted(isNaN(num) ? 0 : num);
                  setFeedback(null);
                }} />
                <select value={currency === 1 ? 2 : 1} disabled={true}>
                  <option value={1}>Robux</option>
                  <option value={2}>Tickets</option>
                </select>
              </td>
            </tr>
          )
        }
      </tbody>
    </table>
    {feedback ? <p className='text-danger text-center mb-0'>{feedback}</p> : <p className='mb-0'>&emsp;</p>}
    <div className='row mt-4'>
      <div className='col-4 offset-2'>
        <ActionButton disabled={locked} className={btnStyles.buyButton} 
          label={store.isConvertMode ? 'Convert' : 'Trade'} 
          onClick={(e) => {
            setFeedback(null);
            let amt = parseInt(amount, 10);
            if (isNaN(amt) || !Number.isSafeInteger(amt)) {
              setFeedback('Invalid amount');
              return;
            }
            if (isNaN(rate)) {
              setFeedback('Invalid rate');
              return;
            }
            setLocked(true);
            
            const orderFunction = store.isConvertMode ? createCurrencyExchangeOrder : createCurrencyExchangeOrderREAL;
            
            orderFunction({
              currency,
              desiredRate: isMarketOrder ? amt : Math.ceil(rate * 1000),
              isMarketOrder,
              amount: amt,
            }).then(() => {
              window.location.reload();
            }).catch(e => {
              setFeedback(e.message);
            }).finally(() => {
              setLocked(false);
            });
          }} 
        />
      </div>
      <div className='col-4'>
        <ActionButton disabled={locked} className={btnStyles.cancelButton} label='Cancel' onClick={() => {
          store.setNewPositionVisible(false);
        }} />
      </div>
    </div>
    <p className='mb-0 pt-2'>Your money will be held for safe-keeping until either the {store.isConvertMode ? 'conversion' : 'trade'} executes or you cancel your position.</p>
  </OldModal>
}

export default NewPositionModal;