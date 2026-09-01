import { useRouter } from 'next/router';
import SharedAssetPage from "../../../components/sharedAssetPage";
import { getProductInfoLegacy } from '../../../services/catalog';
import Head from 'next/head';

const GamePage = props => {
  return (
    <>
      {props.name && (
        <Head>
          <title>{props.name} - Athera</title>
          <meta property="og:title" content={props.name} />
          <meta property="og:url" content={`https://athera.sbs/games/${props.assetId}/--`} />
          <meta property="og:type" content="profile" />
          <meta property="og:description" content={props.description} />
          <meta property="og:image" content={`https://athera.sbs/thumbs/asset.ashx?assetId=${props.assetId}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="og:site_name" content="Athera" />
        </Head>
      )}
      <SharedAssetPage idParamName='assetId' nameParamName='name' />
    </>
  );
}
export async function getServerSideProps(context) {
  const { assetId } = context.query;
  const info = await getProductInfoLegacy(assetId);
  try {
    if (info.AssetTypeId != 9) {
      return {
        props: {
          name: null,
          description: null,
          assetId: assetId
        }
      }
    } else {
      return {
        props: {
          name: info.Name,
          description: info.Description,
          assetId: assetId
        }
      }
    }
  } catch (error) {
    console.error(error);
    return {
      props: {
        name: null,
        description: null,
        assetId: null
      }
    };
  }
}
export default GamePage;