import React, { useState } from 'react';
import { createUseStyles } from 'react-jss';
import Head from 'next/head';
import axios from 'axios';
import AuthenticationStore from '../stores/authentication';
import Link from '../components/link';

const useStyles = createUseStyles({
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    background: '#fff',
    border: '1px solid #c3c3c3',
    borderRadius: '4px',
  },
  header: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #c3c3c3',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    cursor: 'pointer',
    border: '1px solid transparent',
    borderBottom: 'none',
    marginBottom: '-1px',
    fontWeight: '600',
    color: '#343434',
    background: '#f8f8f8',
    '&:hover': {
      background: '#eee',
    },
  },
  activeTab: {
    background: '#fff',
    border: '1px solid #c3c3c3',
    borderBottom: '1px solid #fff',
    color: '#000',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #c3c3c3',
    borderRadius: '3px',
    fontSize: '14px',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#00a2ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '16px',
    '&:hover': {
      background: '#008ac9',
    },
    '&:disabled': {
      background: '#ccc',
      cursor: 'not-allowed',
    },
  },
  message: {
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  success: {
    background: '#dff0d8',
    color: '#3c763d',
    border: '1px solid #d6e9c6',
  },
  error: {
    background: '#f2dede',
    color: '#a94442',
    border: '1px solid #ebccd1',
  },
});

const RequestItem = () => {
  const s = useStyles();
  const auth = AuthenticationStore.useContainer();
  const [activeTab, setActiveTab] = useState('roblox');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [robuxPrice, setRobuxPrice] = useState(0);
  const [tixPrice, setTixPrice] = useState(0);
  const [isLimited, setIsLimited] = useState(false);
  const [stock, setStock] = useState(0);

  const [assetUrl, setAssetUrl] = useState('');

  const [rbxmFile, setRbxmFile] = useState(null);
  const [objFile, setObjFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('type', activeTab === 'roblox' ? 'Roblox' : 'UGC');
      formData.append('name', name);
      formData.append('description', description);
      formData.append('robuxPrice', robuxPrice);
      formData.append('tixPrice', tixPrice);
      formData.append('isLimited', isLimited);
      formData.append('stock', stock);

      if (activeTab === 'roblox') {
        formData.append('assetUrl', assetUrl);
      } else {
        if (!rbxmFile || !objFile) throw new Error("RBXM and OBJ files are required for UGC.");
        formData.append('rbxmFile', rbxmFile);
        formData.append('objFile', objFile);
      }

      const performRequest = async (token = null) => {
        const headers = {};
        if (token) headers['x-csrf-token'] = token;

        const res = await fetch(`/apisite/request-item/v1/submit`, {
          method: 'POST',
          headers: headers,
          body: formData,
        });
        return res;
      };

      let res = await performRequest();

      if (res.status === 403) {
        console.log("403 Forbidden. Headers:", [...res.headers.entries()]);
        const token = res.headers.get('x-csrf-token');
        if (token) {
          console.log("Retrying with new CSRF token:", token);
          res = await performRequest(token);
        } else {
          console.warn("No x-csrf-token header found in 403 response.");
        }
      }

      setMessage({ type: 'success', text: 'Item request submitted successfully!' });
      setName('');
      setDescription('');
      setRobuxPrice(0);
      setTixPrice(0);
      setIsLimited(false);
      setStock(0);
      setAssetUrl('');
      setRbxmFile(null);
      setObjFile(null);
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
      }

      if (!res.ok) {
        console.error("Submission Failed:", res.status, res.statusText, text);
        throw new Error(data.message || `Server Error: ${res.status}: ${text}`);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  return (
    <div className='container'>
      <Head>
        <title>Request item - Athera</title>
      </Head>
      <div className={s.container}>
        <h1 className={s.header}>Request New Item</h1>

        {message && (
          <div className={`${s.message} ${message.type === 'success' ? s.success : s.error}`}>
            {message.text}
          </div>
        )}

        <div className={s.tabs}>
          <div
            className={`${s.tab} ${activeTab === 'roblox' ? s.activeTab : ''}`}
            onClick={() => setActiveTab('roblox')}
          >
            Roblox Item
          </div>
          <div
            className={`${s.tab} ${activeTab === 'ugc' ? s.activeTab : ''}`}
            onClick={() => setActiveTab('ugc')}
          >
            UGC Item
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label className={s.label}>Item Name</label>
            <input
              type="text"
              className={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>Description</label>
            <textarea
              className={s.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {activeTab === 'roblox' && (
            <div className={s.formGroup}>
              <label className={s.label}>Roblox Item Link</label>
              <input
                type="url"
                className={s.input}
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="https://www.roblox.com/catalog/..."
                required
              />
            </div>
          )}

          {activeTab === 'ugc' && (
            <>
              <div className={s.formGroup}>
                <label className={s.label}>RBXM File</label>
                <input
                  type="file"
                  className={s.input}
                  accept=".rbxm"
                  onChange={(e) => setRbxmFile(e.target.files[0])}
                  required
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>OBJ File</label>
                <input
                  type="file"
                  className={s.input}
                  accept=".obj"
                  onChange={(e) => setObjFile(e.target.files[0])}
                  required
                />
              </div>
            </>
          )}

          <div className="row">
            <div className="col-6">
              <div className={s.formGroup}>
                <label className={s.label}>Robux Price</label>
                <input
                  type="number"
                  className={s.input}
                  value={robuxPrice}
                  onChange={(e) => setRobuxPrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="col-6">
              <div className={s.formGroup}>
                <label className={s.label}>Tix Price</label>
                <input
                  type="number"
                  className={s.input}
                  value={tixPrice}
                  onChange={(e) => setTixPrice(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className={s.formGroup}>
            <div className={s.checkboxGroup}>
              <input
                type="checkbox"
                checked={isLimited}
                onChange={(e) => setIsLimited(e.target.checked)}
              />
              <label className={s.label} style={{ marginBottom: 0 }}>Is Limited?</label>
            </div>
          </div>

          {isLimited && (
            <div className={s.formGroup}>
              <label className={s.label}>Stock</label>
              <input
                type="number"
                className={s.input}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
              />
            </div>
          )}

          <button type="submit" className={s.submitBtn} disabled={loading}>
            {loading ? 'Submitting...' : activeTab === 'ugc' ? 'Submit Request (-200 Robux)' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestItem;
