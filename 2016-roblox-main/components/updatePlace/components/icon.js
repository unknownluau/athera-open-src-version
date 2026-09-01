import updatePlaceStore from "../stores/updatePlaceStore";
import { useEffect, useState } from "react";
import { multiGetUniverseIcons } from "../../../services/thumbnails";
import request, { getBaseUrl } from "../../../lib/request";
import ActionButton from "../../actionButton";
import useButtonStyles from "../../../styles/buttonStyles";

const Icon = props => {
  const store = updatePlaceStore.useContainer();
  const [icon, setIcon] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const s = useButtonStyles();

  useEffect(() => {
    refreshIcon();
  }, [store.details]);

  const refreshIcon = () => {
    multiGetUniverseIcons({universeIds: [store.details.universeId], size: '420x420'}).then(img => {
      if (img.length && img[0].imageUrl) {
        setIcon(img[0].imageUrl + '?' + new Date().getTime());
      }
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Only image files are allowed');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('File size must be less than 8MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await request('POST', `${getBaseUrl('bb')}/develop/upload-icon?placeId=${store.details.placeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setIcon(`${getBaseUrl('bb')}/img/placeholder.png`);
      
      setTimeout(refreshIcon, 1500);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.message || err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('icon-upload');
    if (fileInput) fileInput.click();
  };

  return (
    <div className='row mt-4'>
      <div className='col-12'>
        <h2 className='fw-bolder mb-4'>Game Icon</h2>
        {error && <p className='mb-0 text-danger'>{error}</p>}
      </div>
      <div className='col-6'>
        <img 
          className='w-100 mx-auto d-block mb-3' 
          src={icon || '/img/placeholder.png'} 
          alt='Your game icon' 
          style={{maxWidth: '420px', maxHeight: '420px'}}
        />
        
        <div className="d-flex flex-column">
          <input
            id="icon-upload"
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileUpload}
            disabled={isUploading || store.locked}
            style={{display: 'none'}}
          />
          <div className='d-inline-block'>
            <ActionButton 
              disabled={isUploading || store.locked} 
              className={s.normal + ' ' + s.continueButton} 
              label={isUploading ? 'Uploading...' : 'Upload'} 
              onClick={triggerFileInput} 
            />
          </div>
          
          <small className="text-muted mt-2">
            Recommended: 512×512 PNG or JPG (Square aspect ratio)
          </small>
        </div>
      </div>
    </div>
  );
}

export default Icon;