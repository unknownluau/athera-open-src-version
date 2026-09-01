import React, { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { getBaseUrl } from '../../lib/request';

const useStyles = createUseStyles({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
});

const ForgotPassword = () => {
  const classes = useStyles();
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const params = new URLSearchParams(window.location.search);

    if (params.get('redirect') === 'true') {
      window.top.location.href = '/?loginmsg=Password reset successfully!';
      return;
    }

    let iframeUrl = `${getBaseUrl()}/UnsecuredContent/forgot.html`;
    if (params.toString()) {
      iframeUrl += `?${params.toString()}`;
    }
    setIframeSrc(iframeUrl);

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return iframeSrc ? (
    <div className={classes.root}>
      <iframe
        className={classes.iframe}
        src={iframeSrc}
        title="Forgot Password - Athera"
        onError={(e) => {
          console.error("iframe failed to load:", e);
        }}
      />
    </div>
  ) : null;
};

export default ForgotPassword;