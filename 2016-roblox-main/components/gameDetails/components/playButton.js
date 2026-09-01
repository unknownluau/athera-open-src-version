import { useState } from "react";
import { createUseStyles } from "react-jss";
import getFlag from "../../../lib/getFlag";
import { launchGame } from "../../../services/games";
import AuthenticationStore from "../../../stores/authentication";
import gameDetailsStore from "../stores/gameDetailsStore";
import useButtonStyles from "../../../styles/buttonStyles";
import ActionButton from "../../actionButton";

const useStyles = createUseStyles({
  buttonWrapper: {
    width: '100%',
    maxWidth: '300px', // Increased size
    marginBottom: '10px',
  },
  button: {
    width: '100%',
    display: 'block',
  },
  disabledText: {
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: '8px',
  }
})

/**
 * Play button
 * @param {{placeId: number}} props 
 * @returns 
 */
const PlayButton = props => {
  const [error, setError] = useState(null);
  const auth = AuthenticationStore.useContainer();
  const gameDetails = gameDetailsStore.useContainer();
  const s = useStyles();
  const buttonStyles = useButtonStyles();

  const onClick = e => {
    if (!gameDetails.placeDetails?.isPlayable) return;

    if (getFlag('launchUsingEsURI', false)) {
      e?.preventDefault();
      if (!auth.isAuthenticated) {
        window.location.href = '/';
        return;
      }
      launchGame({
        placeId: props.placeId,
        year: gameDetails.placeDetails?.year || 2017,
      }).catch(e => {
        // todo: modal
        setError(e.message);
      });
    } else if (getFlag('launchUsingEsWeb', false)) {
      window.location.href = '/RobloxApp/Play?placeId=' + props.placeId;
    } else {
      // TODO: Roblox URI handling here (is this even possible?)
      alert('Support for joining ROBLOX games is not implemented. You will be redirected to ROBLOX to play this game.');
      window.location.href = 'https://www.roblox.com/games/' + props.placeId + '/--';
    }
  }

  const isDisabled = !gameDetails.placeDetails?.isPlayable;

  return <div className='row'>
    <div className={'col-12 mx-auto ' + s.buttonWrapper}>
      {error && <p className='text-danger mb-1 mt-1'>{error}</p>}
      {isDisabled && <p className={s.disabledText}>You cannot access this place at this time.</p>}
      <img
        src='/img/games/play.png'
        alt='Play'
        onClick={onClick}
        className={s.button}
        style={{
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
          border: 'none',
          backgroundColor: 'transparent',
          padding: 0,
        }}
      />
    </div>
  </div>
}

export default PlayButton;