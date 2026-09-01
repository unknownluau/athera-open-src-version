import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ActionButton from "../components/actionButton";
import useButtonStyles from "../styles/buttonStyles";
import { getFullUrl, getBaseUrl } from '../lib/request';
import Image from 'next/image';
import Link from 'next/link';

const GroupSearch = () => {
  const buttonStyles = useButtonStyles();
  const router = useRouter();
  const { keyword: initialKeyword = "" } = router.query;
  const [searchTerm, setSearchTerm] = useState(initialKeyword);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupIcons, seticons] = useState({});

  const geticons = async (groupIds) => {
    if (!groupIds.length) return;
    
    try {
      const ids = groupIds.join('%2C');
      const response = await fetch(
        getFullUrl('thumbnails', `/v1/groups/icons?groupIds=${ids}&format=png&size=420x420`)
      );

      if (response.ok) {
        const data = await response.json();
        const iconsMap = {};
        data.data.forEach(icon => {
          iconsMap[icon.targetId] = icon.imageUrl;
        });
        seticons(prev => ({ ...prev, ...iconsMap }));
      }
    } catch (err) {
      console.error("Failed to fetch group icons:", err);
    }
  };

  const dosearch = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getFullUrl('groups', `/v1/groups/search?keyword=${encodeURIComponent(
          keyword
        )}&maxRows=12&startIndex=0`)
      );

      if (!response.ok) {
        throw new Error("Failed to search for groups!");
      }

      const data = await response.json();
      setSearchResults(data);

      if (data.data?.length) {
        const groupIds = data.data.map(group => group.id);
        geticons(groupIds);
      }
    } catch (err) {
      setError(err.message);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const search = (e) => {
    e.preventDefault();
    router.push({
      pathname: router.pathname,
      query: { keyword: searchTerm }
    }, undefined, { shallow: true });
    dosearch(searchTerm);
  };

  useEffect(() => {
    if (initialKeyword) {
      dosearch(initialKeyword);
    }
  }, [initialKeyword]);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Group Search</h1>

      <form onSubmit={search} className="mb-4 d-flex justify-content-center">
        <div className="input-group" style={{ maxWidth: '600px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              marginRight: '10px', 
              height: '38px',
              borderRadius: '0'
            }}
          />
          <ActionButton
            className={`${buttonStyles.buyButton} w-auto`}
            label="Search Groups"
            type="submit"
            disabled={isLoading}
            style={{ 
              height: '38px',
              borderRadius: '0'
            }}
          />
        </div>
      </form>

      {isLoading && <p>Searching...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {searchResults && (
        <div>
          <h2>Results for "{searchResults.keyword}"</h2>
          
          {searchResults.data.length === 0 ? (
            <p>No groups found.</p>
          ) : (
            <div className="row">
              {searchResults.data.map((group) => (
                <div key={group.id} className="col-md-4 mb-4">
                  <Link 
                    href={`${getBaseUrl()}/My/Groups.aspx?gid=${group.id}`}
                    passHref
                    legacyBehavior
                  >
                    <a 
                      className="card border-0 text-decoration-none"
                      style={{ 
                        height: '100%',
                        display: 'block',
                        borderRadius: '0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        color: 'inherit'
                      }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex align-items-start" style={{ gap: '15px' }}>
                          {groupIcons[group.id] && (
                            <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                              <Image 
                                src={groupIcons[group.id]} 
                                alt={`${group.name} icon`}
                                width={80}
                                height={80}
                                style={{ borderRadius: '0' }}
                                unoptimized
                              />
                            </div>
                          )}
                          <div>
                            <h5 className="card-title mb-1" style={{ fontSize: '1.1rem' }}>{group.name}</h5>
                            <p className="card-text text-muted small mb-2" style={{ 
                              maxHeight: '40px', 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {group.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                          <span className="text-muted small">
                            {group.memberCount} members
                          </span>
                          <span className="text-muted small">
                            {new Date(group.created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupSearch;
