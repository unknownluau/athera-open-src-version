import React, { useEffect, useRef } from 'react';

const loginfuckasspage = () => {
  const donAlready = useRef(false);

  useEffect(() => {
    if (donAlready.current) return;
    donAlready.current = true;

    if (document.cookie.includes('.ROBLOSECURITY')) {
      window.location.href = '/home';
      return;
    }

    const authXhr = new XMLHttpRequest();
    authXhr.open('GET', '/apisite/users/v1/users/authenticated', false);
    authXhr.withCredentials = true;
    authXhr.send();
    if (authXhr.status === 200) {
      try {
        const usrData = JSON.parse(authXhr.responseText);
        if (usrData.id && usrData.name) {
          window.location.href = '/home';
          return;
        }
      } catch (e) {}
    }

    document.body.style.overflow = 'hidden';

    const msgHndlr = (e) => {
      if (e.data && e.data.type === 'navigate') {
        if (e.data.url) {
          const uRL = new URL(e.data.url, window.location.origin);
          if (uRL.searchParams.has('loginmsg')) {
            window.location.href = '/auth' + uRL.search;
          } else {
            window.location.href = e.data.url;
          }
        }
      }
    };

    window.addEventListener('message', msgHndlr);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('message', msgHndlr);
    };
  }, []);

  return (
    <iframe
      src="/UnsecuredContent/index.html"
      title="login"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none'
      }}
    />
  );
};

export default loginfuckasspage;
