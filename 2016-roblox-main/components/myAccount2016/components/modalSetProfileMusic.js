import React, { useState } from "react";
import { setMyProfileMusic, getMyProfileMusic } from "../../../services/users";
import MyAccountStore from "../stores/myAccountStore";
import useFormStyles from "../styles/forms";

const ModalSetProfileMusic = () => {
  const store = MyAccountStore.useContainer();
  const s = useFormStyles();
  const [assetId, setAssetId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await setMyProfileMusic(assetId ? parseInt(assetId) : null);
      store.setModalMessage({
        title: "Success!",
        message: "Profile music set successfully!"
      });
      store.setModal("MODAL_OK");
    } catch (e) {
      console.error(e);
      alert("Failed to set profile music: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <label className="form-label">Asset ID (enter an audio asset ID, or leave blank to remove):</label>
        <input
          className={s.textInput}
          type="number"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
        />
      </div>
      <button
        className="btn btn-primary w-100"
        onClick={handleSave}
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default ModalSetProfileMusic;
