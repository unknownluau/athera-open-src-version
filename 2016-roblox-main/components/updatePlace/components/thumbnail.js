import updatePlaceStore from "../stores/updatePlaceStore";
import { useEffect, useState } from "react";
import { multiGetAssetThumbnails } from "../../../services/thumbnails";
import request, { getBaseUrl } from "../../../lib/request";
import ActionButton from "../../actionButton";
import useButtonStyles from "../../../styles/buttonStyles";

const Thumbnail = props => {
  const store = updatePlaceStore.useContainer();
  const [thumbnail, setThumbnail] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const s = useButtonStyles();

  useEffect(() => {
    refreshThumbnail();
  }, [store.details]);

  const refreshThumbnail = () => {
    multiGetAssetThumbnails({ assetIds: [store.details.placeId] }).then(img => {
      if (img.length && img[0].imageUrl) {
        setThumbnail(img[0].imageUrl + '?' + new Date().getTime());
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
      
      await request('POST', `${getBaseUrl('bb')}/develop/upload-thumbnail?placeId=${store.details.placeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setThumbnail(`${getBaseUrl('bb')}/img/placeholder.png`);
      
      setTimeout(refreshThumbnail, 1500);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.message || err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('thumbnail-upload');
    if (fileInput) fileInput.click();
  };

  return (
    <div className='row mt-4'>
      <div className='col-12'>
        <h2 className='fw-bolder mb-4'>Thumbnail</h2>
        {error && <p className='mb-0 text-danger'>{error}</p>}
      </div>
      <div className='col-6'>
        <img 
          className='w-100 mx-auto d-block mb-3' 
          src={thumbnail || '/img/placeholder.png'} 
          alt='Your game thumbnail' 
          style={{ maxWidth: '420px', maxHeight: '420px' }}
        />
        
        <div className="d-flex flex-column">
          <input
            id="thumbnail-upload"
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileUpload}
            disabled={isUploading || store.locked}
            style={{ display: 'none' }}
          />
          <div className='d-inline-block'>
            <ActionButton 
              disabled={isUploading || store.locked} 
              className={s.normal + ' ' + s.continueButton} 
              label={isUploading ? 'Uploading...' : 'Upload'} 
              onClick={triggerFileInput} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Thumbnail;