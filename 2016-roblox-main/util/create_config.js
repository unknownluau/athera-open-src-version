const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const configPath = path.join(__dirname, '../config.json');

const main = () => {
  if (fs.existsSync(configPath)) {
    console.error('config.json already exists at this path:', configPath, '\n\nIf you want to create a fresh config, manually delete or move this file first, then run this script again.');
    return
  }
  fs.writeFileSync(configPath, JSON.stringify({
    "serverRuntimeConfig": {
      backend: {
        csrfKey: crypto.randomBytes(64).toString('base64'),
      }
    },
    "publicRuntimeConfig": {
      "backend": {
      "proxyEnabled": true,
      "flags": {
        "myAccountPage2016Enabled": true,
        "catalogGenreFilterSupported": true,
        "catalogPageLimit": 28,
        "catalogSaleCountVisibleFromDetailsEndpoint": true,
        "commentsEndpointHasAreCommentsDisabledProp": true,
        "catalogDetailsPageResellerLimit": 10,
        "avatarPageInventoryLimit": 10,
        "friendsPageLimit": 25,
        "settingsPageThemeSelectorEnabled": true,
        "tradeWindowInventoryCollectibleLimit": 10,
        "moneyPagePromotionTabVisible": false,
        "gameGenreFilterSupported": true,
        "avatarPageOutfitCreatedAtAvailable": true,
        "catalogDetailsPageOwnersTabEnabled": true,
        "launchUsingEsURI": true,
        "downloadPageEnabled": true,
        "downloadGameClients": [
          {
            "title": "Windows Athera Launcher",
            "url": "https://cdn.athera.sbs/AtheraLauncher.exe",
            "imageUrl": "/otherlogos/windows.png"
          },
          {
            "title": "Linux {SOON}",
            "url": "/download",
            "imageUrl": "/otherlogos/Linux.png"
          },
          {
            "title": "Athera FPS Unlocker",
            "url": "https://github.com/unknownluau/atherafpsunlocker/releases/latest",
            "imageUrl": "/otherlogos/fpsunlocker.png"
          }
        ]
      },
      "baseUrl": "https://athera.sbs/",
      "apiFormat": "https://athera.sbs/apisite/{0}{1}"
    }
    },
  }));
  console.log('config.json created at this path:', configPath);
  return 0
}

main();