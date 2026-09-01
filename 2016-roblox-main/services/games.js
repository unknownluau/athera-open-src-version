import getFlag from "../lib/getFlag";
import request, { getBaseUrl, getFullUrl } from "../lib/request"
import { itemNameToEncodedName } from "./catalog";
const gamePage2015Enabled = getFlag('2015GameDetailsPageEnabled', false);
const csrEnabled = getFlag('clientSideRenderingEnabled', false);

export const isLibraryItem = ({ assetTypeId }) => {
  switch (assetTypeId) {
    case 62:
    case 40:
    case 38:
    case 24:
    case 21:
    case 13:
    case 10:
    case 5:
    case 4:
    case 3:
    case 1:
      return true;
    default:
      return false;
  }
}

export const getGameUrl = ({ placeId, name }) => {
  return `/games/${placeId}/${itemNameToEncodedName(name)}`;
}

export const getUserGames = ({ userId, cursor }) => {
  return request('GET', getFullUrl('games', `/v2/users/${userId}/games?cursor=${encodeURIComponent(cursor || '')}`)).then(d => d.data);
}

export const getGroupGames = ({ groupId, cursor }) => {
  return request('GET', getFullUrl('games', `/v2/groups/${groupId}/games?cursor=${encodeURIComponent(cursor || '')}`)).then(d => d.data);
}

export const getLibraryItemUrl = ({ assetId, name }) => {
  return `/library/${assetId}/${itemNameToEncodedName(name)}`;
}

export const getGameSorts = ({ gameSortsContext }) => {
  return request('GET', getFullUrl('games', `/v1/games/sorts?gameSortsContext=${encodeURIComponent(gameSortsContext || '')}`)).then(d => d.data)
}

export const getGameList = ({ sortToken, limit, genre = 0, keyword }) => {
  return request('GET', getFullUrl('games', `/v1/games/list?sortToken=${encodeURIComponent(sortToken)}&maxRows=${limit}&genre=${genre}&keyword=${keyword}`)).then(d => d.data)
}

export const getGameMedia = ({ universeId }) => {
  return request('GET', getFullUrl('games', `/v2/games/${universeId}/media`)).then(d => d.data.data);
}

export const launchGame = async ({ placeId, jobId, year = 2017 }) => {
  let url = getBaseUrl() + '/game/get-join-script?placeId=' + encodeURIComponent(placeId);
  if (jobId) url += '&gameId=' + encodeURIComponent(jobId);
  const result = await request('GET', url);

  let launchUrl;

  if (typeof result.data === 'string') {
    const match = result.data.match(/ticket=([^&"']+)/);
    if (match && match[1]) {
      const ticket = match[1];
      launchUrl = `atheraclient://join?place=${placeId}&ticket=${encodeURIComponent(ticket)}&year=${year}`;
      console.log("got raw response, using atheraclient:// with year:", year);
    } else {
      console.error("Could not extract ticket from raw response (is user authenticated?)", result.data);
      return;
    }
  } else if (result.data.clientArgs) {
    launchUrl = `rbxeconsim:${result.data.clientArgs}`;
    console.log("Using rbxeconsim");
  } else {
    console.error("Error: Unrecognized response format", result.data);
    return;
  }

  console.log("launching game with:", launchUrl);

  const aTag = document.createElement('a');
  aTag.setAttribute('href', launchUrl);
  document.body.appendChild(aTag);
  aTag.click();

  setTimeout(() => {
    aTag.remove();
  }, 1000);
};

export const multiGetPlaceDetails = ({ placeIds }) => {
  return request('GET', getFullUrl('games', `/v1/games/multiget-place-details?placeIds=${encodeURIComponent(placeIds.join(','))}`)).then(d => d.data);
}

export const multiGetUniverseDetails = ({ universeIds }) => {
  return request('GET', getFullUrl('games', `/v1/games?universeIds=${encodeURIComponent(universeIds.join(','))}`)).then(d => d.data.data);
}

export const getServers = ({ placeId, offset }) => {
  return request('GET', getBaseUrl() + `/games/getgameinstancesjson?placeId=${placeId}&startIndex=${offset}`).then(d => d.data);
}

export const multiGetGameVotes = ({ universeIds }) => {
  return request('GET', getFullUrl('games', '/v1/games/votes?universeIds=' + encodeURIComponent(universeIds.join(',')))).then(d => d.data.data);
}

export const voteOnGame = ({ universeId, isUpvote }) => {
  return request('PATCH', getFullUrl('games', '/v1/games/' + universeId + '/user-votes'), {
    vote: isUpvote,
  }).then(d => d.data.data);
}