import React, { useState } from "react";
import { abbreviateNumber } from "../../lib/numberUtils";
import { getGameUrl } from "../../services/games";
import Link from "../link";

const SmallGameCard = ({
  name,
  placeId,
  iconUrl = "/img/empty.png",
  likes = 0,
  dislikes = 0,
  playerCount = 0,
  isSponsored = false,
  className = "",
  creatorId,
  creatorType,
  creatorName,
  year,
}) => {
  const [imgSrc, setImgSrc] = React.useState(iconUrl);

  React.useEffect(() => {
    setImgSrc(iconUrl || "/img/empty.png");
  }, [iconUrl]);

  const totalVotes = likes + dislikes;
  const votePercent = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : null;

  const url = getGameUrl({ placeId, name });

  if (isSponsored) {
    return (
      <li className={`list-item game-card sponsored-game ${className}`} style={{ display: 'inline-block' }}>
        <a href={url} className="game-card-container">
          <div className="game-card-thumb-container">
            <img
              src={imgSrc}
              alt={name}
              className="game-card-thumb"
              onError={() => setImgSrc("/img/empty.png")}
              loading="lazy"
            />
            {year && <span className="game-card-year">{year}</span>}
          </div>
          <div className="game-card-name game-name-title" title={name}>
            {name}
          </div>
        </a>
      </li>
    )
  }

  return (
    <li className={`list-item game-card game-tile ${className}`}>
      <div className="game-card-container">
        <a href={url} className="game-card-link">
          <div className="game-card-thumb-container">
            <img
              src={imgSrc}
              alt={name}
              className="game-card-thumb"
              onError={() => setImgSrc("/img/empty.png")}
              loading="lazy"
            />
            {year && <span className="game-card-year">{year}</span>}
          </div>
          <div className="game-card-name game-name-title" title={name}>
            {name}
          </div>
        </a>
      </div>
    </li>
  );
};

export default SmallGameCard;