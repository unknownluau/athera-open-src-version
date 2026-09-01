import { useRouter } from "next/dist/client/router";
import React from "react";
import Head from "next/head";
import Theme2016 from "../../../components/theme2016";
import UserProfile from "../../../components/userProfile";
import UserStore from "../../../components/userProfile/stores/UserProfileStore";
import { getUserInfo } from "../../../services/users";

const UserProfilePage = props => {
  const router = useRouter();
  const userId = router.query['userId'];
  const id = Array.isArray(userId) ? userId[0] : userId;

  const title = props.name ? `${props.name}'s Profile` : 'User Profile';
  const description = props.description || `Check out ${props.name || 'this user'}'s profile on Athera.`;
  const image = `https://athera.sbs/Thumbs/Avatar-Headshot.ashx?userId=${id}&width=420&height=420`;

  return (
    <>
      <Head>
        <title>{title} - Athera</title>
        <meta property="og:site_name" content="Athera" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="420" />
        <meta property="og:image:height" content="420" />
      </Head>
      <UserStore.Provider>
        <Theme2016>
          <UserProfile userId={id} {...props} />
        </Theme2016>
      </UserStore.Provider>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const userId = params.userId;
  try {
    const info = await getUserInfo({ userId });
    return {
      props: {
        ...info,
      },
    };
  } catch (e) {
    return {
      props: {
        userId,
      },
    };
  }
}

export default UserProfilePage;