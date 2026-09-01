import React, { useState, useRef } from "react";
import { createUseStyles } from "react-jss";
import { getBaseUrl } from "../../../lib/request";

const useStyles = createUseStyles({
  playButton: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#000',
    padding: 0,
    zIndex: 100,
    outline: 'none',
  },
  icon: {
    width: '32px',
    height: '32px',
    fill: 'currentColor',
  }
});

const AudioPlayer = ({ assetId }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const s = useStyles();

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("playing failed for some reason:", err);
      });
    }
    setPlaying(!playing);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={getBaseUrl() + 'asset/?id=' + assetId}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
      <button className={s.playButton} onClick={toggle} title={playing ? "Pause" : "Play"}>
        {playing ? (
          <svg className={s.icon} viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className={s.icon} viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  );
};

export default AudioPlayer;