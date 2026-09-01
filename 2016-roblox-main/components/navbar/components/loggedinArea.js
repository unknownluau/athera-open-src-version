import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import { logout } from "../../../services/auth";
import AuthenticationStore from "../../../stores/authentication";
import Link from "../../link";
import Dropdown2016 from "../../dropdown2016";

const useDropdownStyles = createUseStyles({
  wrapper: {
    width: "125px",
    position: "absolute",
    top: "45px",
    right: "10px",
    boxShadow: "0 -5px 20px rgba(25,25,25,0.15)",
    userSelect: "none",
    background: "white",
    zIndex: 10,
  },
  text: {
    padding: "10px",
    marginBottom: 0,
    fontSize: "16px",
    cursor: "pointer",
    "&:hover": {
      background: "#eaeaea",
      borderLeft: "4px solid #0074BD",
    },
    "&:hover > a": {
      marginLeft: "-4px",
    },
    "& > a": {
      textDecoration: "none",
      color: "inherit",
      display: "block",
      width: "100%",
    }
  },
});

const SettingsDropdown = () => {
  const s = useDropdownStyles();
  return (
    <div className={s.wrapper}>
      <div className={s.text}>
        <Link href="/My/Account">
          <a>Settings</a>
        </Link>
      </div>
      <div className={s.text}>
        <Link href="/help">
          <a>Help</a>
        </Link>
      </div>
      <div className={s.text}>
        <a
          href="/logout"
          onClick={(e) => {
            e.preventDefault();
            logout().then(() => {
              window.location.reload();
            });
          }}
        >
          Logout
        </a>
      </div>
    </div>
  );
};

const useLoginAreaStyles = createUseStyles({
  linkContainerCol: {
    width: "25%",
    float: "right",
    marginLeft: "auto",
    marginRight: "3px",
    '@media(max-width: 991px)': {
      marginLeft: '0',
      padding: 0,
      width: 'calc(60% - 3px)',
    },
    '@media(max-width: 400px)': {
      width: 'calc(68% - 3px)',
    }
  },
  row: {
    display: "block",
    height: "100%",
  },
  linkContainer: {
    display: "flex",
    margin: 0,
    marginRight: "20px",
    paddingLeft: '12px',
    paddingRight: '12px',
    justifyContent: 'flex-end',
    alignItems: 'center',
    listStyle: 'none',
  },
  ageNameContainer: {
    color: "#000 !important",
    marginRight: "10px",
    fontSize: "12px",
    fontWeight: "500",
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
  },
  nameLink: {
    color: "#000 !important",
    textDecoration: "none",
    '&:hover $nameSpan': {
      textDecoration: 'underline',
    },
  },
  nameSpan: {
    fontWeight: 500,
    "&:after": {
      content: '": "',
    },
  },
  ageSpan: {
    fontWeight: 500,
  },
  messagesContainer: {
    height: "40px",
    display: "flex",
    alignItems: 'center',
  },
  messagesLink: {
    padding: "6px 9px",
    filter: "brightness(0)",
  },
  currencyContainer: {
    display: "flex",
    cursor: "pointer",
    alignItems: 'center',
  },
  robuxContainer: {
    paddingLeft: '6px'
  },
  currencyLink: {
    display: "flex",
    alignItems: 'center',
    textDecoration: 'none',
    color: "#000 !important",
  },
  currencyIcon: {
    filter: "brightness(0)",
  },
  currencySpan: {
    marginLeft: '5px',
    marginRight: '14px',
    fontSize: '16px',
    fontWeight: 300,
    '@media(max-width: 400px)': {
      marginRight: '4px'
    }
  },
  settingsIcon: {
    filter: "brightness(0)",
    cursor: 'pointer',
    fontSize: '20px',
  },
  text: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  hideOnMobile: {
    '@media(max-width: 991px)': {
      display: 'none !important'
    }
  },
  dropdownClass: {
    marginTop: '50px',
    right: '0',
  },
});

const LoggedInArea = () => {
  const s = useLoginAreaStyles();
  const authStore = AuthenticationStore.useContainer();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (authStore.robux === null || authStore.tix === null) return null;

  return (
    <div className={s.linkContainerCol}>
      <div className={`${s.row} row`}>
        <ul className={s.linkContainer}>
          <li className={`${s.ageNameContainer} ${s.hideOnMobile}`}>
            <a href={`/users/${authStore.userId}/profile`} className={s.nameLink}>
              <span className={s.nameSpan}>{authStore.username}</span>
            </a>
            <span className={s.ageSpan}>13+</span>
          </li>

          <li className={`${s.messagesContainer} ${s.hideOnMobile}`}>
            <a href="/My/Messages" className={s.messagesLink}>
              <span className="icon-nav-message2" />
            </a>
          </li>

          <li className={`${s.currencyContainer} ${s.robuxContainer}`}>
            <a className={s.currencyLink} href='/My/Money.aspx'>
              <span className={`${s.currencyIcon} icon-nav-robux`} />
              <span className={s.currencySpan}>
                {authStore.robux.toLocaleString()}
              </span>
            </a>
          </li>

          <li className={s.text}>
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                setSettingsOpen(!settingsOpen);
              }}
            >
              <span
                className={`icon-nav-settings ${s.settingsIcon}`}
                id="nav-settings"
              />
            </a>

            {settingsOpen && (
              <Dropdown2016
                dropdownClass={s.dropdownClass}
                onlyDropdown={true}
                options={[
                  {
                    name: 'Settings',
                    url: '/My/Account',
                  },
                  {
                    name: 'Logout',
                    onClick: (e) => {
                      e?.preventDefault();
                      logout().then(() => {
                        window.location.reload();
                      });
                    },
                  },
                ]}
              />
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LoggedInArea;