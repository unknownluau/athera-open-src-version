import '../styles/globals.css';
import '../styles/helpers/textHelpers.css';
import 'bootstrap/dist/css/bootstrap.min.css';
// Roblox CSS
import '../styles/roblox/gameStyles2020.css';
import '../styles/roblox/icons.css';
import '../styles/roblox/2020navbar1.css';
import '../styles/roblox/2020navbar2.css';
import Navbar from '../components/navbar';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Footer from '../components/footer';
import dayjs from '../lib/dayjs';
import NextNProgress from "nextjs-progressbar";
import LoginModalStore from '../stores/loginModal';
import AuthenticationStore from '../stores/authentication';
import NavigationStore from '../stores/navigation';
import { getTheme, themeType } from '../services/theme';
import MainWrapper from '../components/mainWrapper';
import GlobalAlert from '../components/globalAlert';
import ThumbnailStore from "../stores/thumbnailStore";
import getFlag from "../lib/getFlag";
import Chat from "../components/chat";

if (typeof window !== 'undefined') {
  console.log(String.raw`
      _______      _________      _____       ______     _
     / _____ \    |____ ____|    / ___ \     | ____ \   | |
    / /     \_\       | |       / /   \ \    | |   \ \  | |
    | |               | |      / /     \ \   | |   | |  | |
    \ \______         | |      | |     | |   | |___/ /  | |
     \______ \        | |      | |     | |   |  ____/   | |
            \ \       | |      | |     | |   | |        | |
     _      | |       | |      \ \     / /   | |        |_|
    \ \_____/ /       | |       \ \___/ /    | |         _
     \_______/        |_|        \_____/     |_|        |_|

     Keep your account safe! Do not paste any text here.

     If someone is asking you to paste text here then you're
     giving someone access to your account, your gear, and
     your ROBUX.
	`);
}

const loginandsignuppaths = ['/', '/auth', '/forgotpasswordOrUsername'];

const Unknownisaw = ({ children }) => {
  const { isAuthenticated, isPending } = AuthenticationStore.useContainer();

  useEffect(() => {
    if (isPending) return;
    if (!isAuthenticated && !loginandsignuppaths.includes(window.location.pathname)) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isPending]);

  return children;
};

function RobloxApp({ Component, pageProps }) {
  // set theme:
  // jss globals apparently don't support parameters/props, so the only way to do a dynamic global style is to either append a <style> element, use setAttribute(), or append a css file.
  // @ts-ignore
  useEffect(() => {
    const el = typeof window !== 'undefined' && document.getElementsByTagName('body');
    if (el && el.length) {
      const theme = getTheme();
      const divBackground = theme === themeType.obc2016 ? 'url(/img/Unofficial/obc_theme_2016_bg.png) repeat-x #222224' : document.getElementById('theme-2016-enabled') ? '#e3e3e3' : '#fff';
      el[0].setAttribute('style', 'background: ' + divBackground);
    }
  }, [pageProps]);

  return <div>
    <Head>
      <link rel="preload" href="/img/GothamSSm-Light.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/img/GothamSSm-Book.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/img/GothamSSm-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin={''} />
      <title>{pageProps.title || 'Athera'}</title>
      <link rel='icon' type="image/vnd.microsoft.icon" href='/favicon.ico' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <script src="/js/3d/three-r137/three.js" />
      <script src="/js/3d/three-r137/MTLLoaderr.js" />
      <script src="/js/3d/three-r137/OBJLoaderr.js" />
      <script src="/js/3d/three-r137/RobloxOrbitControls.js" />
      <script src="/js/3d/tween.js" />
    </Head>
    <AuthenticationStore.Provider>
      <LoginModalStore.Provider>
        <NavigationStore.Provider>
          <Navbar />
        </NavigationStore.Provider>
      </LoginModalStore.Provider>
      <GlobalAlert />
      <Unknownisaw>
        <MainWrapper className="gotham-font light-theme">
          {getFlag('clientSideRenderingEnabled', false) ? <NextNProgress options={{ showSpinner: false }} color='#fff' height={2} /> : null}
          <ThumbnailStore.Provider>
            <Component {...pageProps} />
            <Chat />
          </ThumbnailStore.Provider>
        </MainWrapper>
        <Footer />
      </Unknownisaw>
    </AuthenticationStore.Provider>
  </div>
}

export default RobloxApp;