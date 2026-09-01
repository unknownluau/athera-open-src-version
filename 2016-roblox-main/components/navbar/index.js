import React, { useState, useRef, useEffect } from "react";
import AuthenticationStore from "../../stores/authentication";
import NavigationStore from "../../stores/navigation";
import LoggedInArea from "./components/loggedInArea";
import NavSideBar from "../navSidebar";

const SearchSuggestionEntry = ({ mode, url, query }) => (
  <li className="navbar-search-option rbx-clickable-li">
    <a
      className="navbar-search-anchor"
      href={`${url}?keyword=${encodeURIComponent(query)}`}
    >
      Search "{query}" in {mode}
    </a>
  </li>
);

const Navbar = () => {
  const authStore = AuthenticationStore.useContainer();
  const navStore = NavigationStore.useContainer();
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);
  const mainNavBarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.assign(`/games?keyword=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div id="navigation-container" className="light-theme gotham-font">
      <style>{`
        #navigation-container {
            padding-top: 40px !important;
        }
        #header {
            position: fixed !important;
            top: 0 !important;
            width: 100%;
            z-index: 1041;
        }
        .rbx-nav-collapse { display: flex !important; }
        .icon-logo { display: none !important; }
        .icon-logo-r { display: inline-block !important; }
        @media (max-width: 991px) {
          .rbx-navbar.hidden-md.hidden-lg {
            display: flex !important;
            position: relative !important;
            top: 0 !important;
            justify-content: space-around;
            background: #fff;
            border-top: 1px solid #e3e3e3;
          }
        }
        .light-theme .navbar-search .input-group {
          background-color: hsla(0, 0%, 100%, 0.9) !important;
          border: 1px solid rgba(57, 59, 61, 0.2) !important;
          border-radius: 8px !important; 
          height: 32px !important;
          width: 100% !important;
          display: flex !important;
          overflow: hidden !important;
        }
        .light-theme .navbar-search .input-field {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          padding: 0 12px !important;
          height: 100% !important;
          width: 100% !important;
          background: transparent !important;
        }
      `}</style>

      <div id="header" className={`navbar-fixed-top rbx-header ${authStore.isAuthenticated ? 'authenticated' : ''}`} role="navigation" ref={mainNavBarRef}>
        <div className="container-fluid" style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 15px', flexWrap: 'wrap' }}>

          <div className="rbx-navbar-header" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div className="navbar-header" style={{ display: 'flex', alignItems: 'center', height: '40px' }}>

              {authStore.isAuthenticated && (
                <div
                  className="rbx-nav-collapse"
                  onClick={() => navStore.setIsSidebarOpen(!navStore.isSidebarOpen)}
                  style={{ cursor: 'pointer', paddingRight: '10px', alignItems: 'center', height: '40px' }}
                >
                  <span className="icon-nav-menu"></span>
                </div>
              )}

              <a className="navbar-brand" href="/home" style={{
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                height: '40px',
                float: 'none',
                marginRight: '30px'
              }}>
                <span className="icon-logo"></span>
                <span className="icon-logo-r"></span>
              </a>
            </div>
          </div>

          <ul className="nav rbx-navbar hidden-xs hidden-sm" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, margin: 0, padding: 0, listStyle: 'none', marginLeft: '8px' }}>
            <li style={{ padding: '0 10px' }}><a className="font-header-2 nav-menu-title text-header" href="/games">Games</a></li>
            <li style={{ padding: '0 10px' }}><a className="font-header-2 nav-menu-title text-header" href="/catalog">Avatar Shop</a></li>
            <li style={{ padding: '0 10px' }}><a className="font-header-2 nav-menu-title text-header" href="/develop">Create</a></li>
            <li style={{ padding: '0 10px' }}><a className="font-header-2 nav-menu-title text-header" href="https://athera.sbs/download">Download</a></li>
          </ul>

          <div
            ref={searchContainerRef}
            id="navbar-universal-search"
            className="navbar-left navbar-search col-xs-5 col-sm-6 col-md-3 col-lg-4"
            role="search"
            style={{
              flexGrow: 1,
              margin: '0 15px',
              position: 'relative',
              maxWidth: '360px',
              minWidth: '150px',
              float: 'none'
            }}
          >
            <form onSubmit={handleSearch}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control input-field"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  autoComplete="off"
                />
              </div>
            </form>

            {isSearchFocused && query.trim() && (
              <ul className="dropdown-menu" role="menu" style={{ display: 'block', width: '100%', position: 'absolute', top: '32px', left: 0, zIndex: 1001 }}>
                <SearchSuggestionEntry mode='Catalog' url='/catalog' query={query} />
                <SearchSuggestionEntry mode='People' url='/search/users' query={query} />
                <SearchSuggestionEntry mode='Games' url='/games' query={query} />
                <SearchSuggestionEntry mode='Groups' url='/SearchGroups.aspx' query={query} />
              </ul>
            )}
          </div>

          <div className="navbar-right rbx-navbar-right" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginLeft: 'auto', float: 'none' }}>
            {authStore.isAuthenticated ? (
              <LoggedInArea />
            ) : (
              <ul className="nav navbar-right rbx-navbar-right-nav" style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                <li className="login-action">
                  <span>
                    <a className="font-header-2 rbx-navbar-login nav-menu-title rbx-menu-item" href="/auth">Log In</a>
                  </span>
                </li>
                <li className="signup-button-container" style={{ paddingLeft: '10px' }}>
                  <a className="rbx-navbar-signup btn-growth-sm nav-menu-title signup-button" href="/">Sign Up</a>
                </li>
              </ul>
            )}
          </div>

          <ul className="nav rbx-navbar hidden-md hidden-lg col-xs-12" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li><a className="font-header-2 nav-menu-title text-header" href="/games">Games</a></li>
            <li><a className="font-header-2 nav-menu-title text-header" href="https://athera.sbs/catalog">Catalog</a></li>
            <li><a className="font-header-2 nav-menu-title text-header" href="/develop">Create</a></li>
            <li><a className="font-header-2 nav-menu-title text-header" href="/download">Download</a></li>
          </ul>

        </div>
      </div>
      {authStore.isAuthenticated && <NavSideBar mainNavBarRef={mainNavBarRef} />}
    </div>
  );
};

export default Navbar;