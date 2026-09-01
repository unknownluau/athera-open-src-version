import ActionButton from "../../../../actionButton";
import VerticalSelector from "../../../../verticalSelector";
import ExchangeStore from "../stores/exchangeStore";
import useButtonStyles from "../../../../../styles/buttonStyles";

const TabSelector = props => {
  const store = ExchangeStore.useContainer();
  const btnStyles = useButtonStyles();
  
  return <div className='col-2'>
    <div className="d-flex mb-2" style={{ gap: '10px' }}>
      <ActionButton 
        className={btnStyles.buyButton} 
        label='Convert' 
        onClick={() => {
          store.setIsConvertMode(true);
          store.setNewPositionVisible(true);
        }} 
      />
      <ActionButton 
        className={btnStyles.buyButton} 
        label='Trade' 
        onClick={() => {
          store.setIsConvertMode(false);
          store.setNewPositionVisible(true);
        }} 
      />
    </div>
    <VerticalSelector selected={store.tab} options={[
      {
        name: 'My R$ Positions',
        url: '#',
        onClick: (v) => {
          store.setTab('My R$ Positions')
        },
      },
      {
        name: 'My TX Positions',
        url: '#',
        onClick: (v) => {
          store.setTab('My TX Positions');
        },
      },
    ]} />
  </div>
}

export default TabSelector;