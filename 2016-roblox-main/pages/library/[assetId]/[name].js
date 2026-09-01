import SharedAssetPage from "../../../components/sharedAssetPage";
import { getProductInfoLegacy } from "../../../services/catalog";
import Head from "next/head";
const ItemPage = ({ name, description, assetId, ...props }) => {
  return (
    <>
      {name && (
        <Head>
          <title>{name} - Athera</title>
          <meta property="og:title" content={name} />
          <meta property="og:url" content={`https://athera.sbs/library/${assetId}/--`} />
          <meta property="og:type" content="profile" />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={`https://athera.sbs/thumbs/asset.ashx?assetId=${assetId}`} />
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
    return {
      props: {
        name: info.Name,
        description: info.Description,
        assetId: assetId
      }
    };
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
export default ItemPage;