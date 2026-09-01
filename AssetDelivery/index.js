require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const cacheFolder = path.join(__dirname, "cache");

if (!fs.existsSync(cacheFolder)) {
    fs.mkdirSync(cacheFolder);
}

app.get("/v1/asset/", async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send("Missing id");

        const filePath = path.join(cacheFolder, id);

        if (fs.existsSync(filePath)) {
            console.log(`Serving cached: ${id}`);
            return res.download(filePath, "asset");
        }

        const assetDeliveryApis = [
            "https://bt.zawg.ca/v1/asset", // ok
            "https://assetdelivery.roblox.com/v1/asset" // ok
        ];

        // PLS DO COOKIE ASSETS UNKNOWNLUAU OR COPYRIGHTTXT
        const headers = {
            "Cookie": ``,
            // "Accept-Encoding": "gzip,deflate,br",
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36" //"Roblox/WinInet"
        };

        let successfulResponse = null;
        let finalurl = null;

        // if (process.env.useMultiFetch) {
        const shuffled = assetDeliveryApis.sort(() => 0.5 - Math.random());

        for (const baseUrl of shuffled) {
            try {
                // const check = await axios.get(`${baseUrl}/?id=7702904`, { headers, timeout: 2500 });
                // if (check.status === 200) {
                    successfulResponse = await axios.get(`${baseUrl}/?id=${id}`, {
                        headers,
                        responseType: "stream",
                        timeout: 10000
                    });
                    finalurl = baseUrl
                    break;
                // }
                console.log(`this fuckin failed by ${baseUrl} with id of ${id}`);
            } catch (err) {
                continue;
            }
        }
        // } else {
        //     const robloxUrl = `http://assetdelivery.roblox.com/v1/asset/?id=${id}`;
        //     successfulResponse = await axios.get(robloxUrl, {
        //         headers,
        //         responseType: "stream",
        //         timeout: 10000
        //     });
        //     console.log("yay got response i think idk rolox");
        // }

        if (!successfulResponse) {
            console.log(successfulResponse);
            console.log("failed 502");
            return res.status(502).send("No asset for u");
        }

        res.setHeader("Content-Disposition", `attachment; filename="asset"`);

        const writer = fs.createWriteStream(filePath);
        successfulResponse.data.pipe(writer);

        successfulResponse.data.pipe(res);
        console.log(`Serving asset: ${id} from ${finalurl}`);
    } catch (e) {
        console.error(e.message);
        if (!res.headersSent) {
            res.status(500).send("Error fetching asset");
        }
    }
});

app.listen(6767, () => console.log("Started on Port " + 6767));