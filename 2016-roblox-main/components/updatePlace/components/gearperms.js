import updatePlaceStore from "../stores/updatePlaceStore";
import {useEffect, useState} from "react";
import ActionButton from "../../actionButton";
import useButtonStyles from "../../../styles/buttonStyles";
import {setGearPermissions} from "../../../services/develop";

const GearPermissions = props => {
  const s = useButtonStyles();
  const store = updatePlaceStore.useContainer();
  const [gearEnabled, setGearEnabled] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const resetForm = () => {
    setFeedback(null);
    setGearEnabled(store.details.gearPermissions || false);
  }

  const save = () => {
    store.setLocked(true);
    setFeedback(null);
    Promise.all([
	// apisite/develop/v1/universes/${universeId}/gear-permissions
      setGearPermissions({
        universeId: store.details.universeId,
        enabled: gearEnabled,
      }),
    ]).then(() => {
      window.location.reload();
    }).catch(e => {
      store.setLocked(false);
      setFeedback(e.message);
    })
  }

  useEffect(() => {
    resetForm();
  }, [store.details]);

  return <div className='row mt-4'>
    <div className='col-12'>
      <h2 className='fw-200f mb-4'>Gears</h2>
      {
        feedback ? <p className='text-danger'>{feedback}</p> : null
      }
      <div>
        <p className='fw-bold'>Ingame Gear Permissions :</p>
<p className='fw-bold' style={{ color: 'red' }}>WARNING : PEOPLE CAN ABUSE THE GEAR IN YOUR GAME SUCH AS EXPLODE AND PAINT AND MORE. THIS IS ON YOUR OWN RISK!</p>
        <select 
          value={gearEnabled ? 'enabled' : 'disabled'} 
          className='br-none border-1 border-secondary pe-2' 
          onChange={v => {
            setGearEnabled(v.currentTarget.value === 'enabled');
          }}
        >
          <option value="enabled">On</option>
          <option value="disabled">Off</option>
        </select>
      </div>

      <div className='mt-4'>
        <div className='d-inline-block'>
          <ActionButton disabled={store.locked} className={s.normal + ' ' + s.continueButton} label='Save' onClick={save} />
        </div>
        <div className='d-inline-block ms-4'>
          <ActionButton disabled={store.locked} className={s.normal + ' ' + s.cancelButton} label='Cancel' onClick={() => {
            resetForm();
          }} />
        </div>
      </div>
    </div>
  </div>
}

export default GearPermissions;