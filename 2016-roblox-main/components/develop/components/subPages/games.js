import { useEffect, useState } from "react";
import { createUseStyles } from "react-jss";
import { useRouter } from "next/router";
import { getGroupGames, getUserGames } from "../../../../services/games";
import AuthenticationStore from "../../../../stores/authentication";
import useButtonStyles from "../../../../styles/buttonStyles";
import ActionButton from "../../../actionButton";
import AssetList from "../assetList";

const useStyles = createUseStyles({

});

const GamesSubPage = props => {
  const s = useStyles();
  const buttonStyles = useButtonStyles();
  const [games, setGames] = useState(null);
  const auth = AuthenticationStore.useContainer();
  const router = useRouter();

  useEffect(() => {
    setGames(null);

    if (props.groupId) {
      getGroupGames({
        groupId: props.groupId,
        cursor: '',
      }).then(data => setGames(data));
    } else if (auth.userId) {
      getUserGames({
        userId: auth.userId,
        cursor: '',
      }).then(data => setGames(data));
    }
  }, [auth.userId, props.groupId]);

  return <div className='row'>
    <div className='col-12 mt-2'>
      <button className='btn btn-success ps-4 pe-4 pt-2 pb-2' style={{ fontSize: '18px', fontWeight: 600 }} onClick={() => {
        window.location.href = '/develop/create-place';
      }}>Create New Game</button>
      <h2 className='mt-3'>Games</h2>
    </div>
    <div className='col-12'>
      {
        games ? (games.data.length === 0 ? <p className='mt-4'>You haven't created any games.</p> : <AssetList assets={games.data.map(v => {
          return {
            assetId: v.rootPlace.id,
            assetType: 9,
            name: v.name,
            universeId: v.id,

            // todo:
            isPublic: true,

          }
        })} />) : null
      }
    </div>
  </div>
}

export default GamesSubPage;