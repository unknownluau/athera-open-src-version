const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 6769;

const deployHistoryPath = path.join(__dirname, 'files', 'DeployHistory.txt');

app.get('/', (req, res) => {
    res.send('what are u doing here');
});

app.get('/version', (req, res) => {
    fs.readFile(deployHistoryPath, 'utf8', (err, data) => {
        if (err) {
            return res.sendStatus(500);
        }

        const matches = [...data.matchAll(/New\s+AtheraPlayerLauncher\s+(version-[a-f0-9]+)/gi)];

        if (matches.length === 0) {
            return res.sendStatus(404);
        }

        res.send(matches[matches.length - 1][1]);
    });
});

app.get('/*path', (req, res) => {
    const filesfolder = path.join(__dirname, 'files', req.path);

    if (fs.existsSync(filesfolder)) {
        console.log(`giving the guy ${filesfolder}`);
        res.download(filesfolder);
    } else {
        res.sendStatus(404);
    }
});

app.listen(port, 'localhost', () => {
    console.log(`hell yea it started at http://localhost:${port}`);
});
