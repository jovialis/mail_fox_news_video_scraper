/**
 * Created by jovialis (Dylan Hanson) on 1/28/22.
 */

const axios = require('axios');

const mongoose = require('mongoose');
const Video = mongoose.model('Video');

let INNERTUBE_API_KEY = null;
let INNERTUBE_CLIENT_VERSION = null;

module.exports = discoverRecentVideos;

/**
 * Discovers all of the most recent videos that have not yet been found.
 */
async function discoverRecentVideos(maxPage = -1) {
    let allVideos = [];

    // Scrape initial data
    const res = await axios.get(`https://www.youtube.com/c/FoxNews/videos`);
    let prevResBody = res.data;

    let shouldStop = false;

    let curPage = 0;
    while (!shouldStop && (maxPage === -1 || curPage <= maxPage)) {
        // Extract the videos from the previous page's body
        const videoIds = getPageVideoIDs(prevResBody);

        // Check if any of the videos have been found before. If so, we're done!
        const exists = await Video.exists({_id: {$in: videoIds}});
        if (exists) shouldStop = true;

        // Push the video ids.
        allVideos.push(...videoIds);

        // Load the next page
        const nextPageRes = await getNextPagePromise(prevResBody);
        prevResBody = JSON.stringify(nextPageRes.data);

        curPage++;
    }

    // Iterate over the VideoIDs and insert new ones.

    // Batch insert
    try {
        return (await Video.insertMany(allVideos.map(id => ({
            _id: id
        })), {
            ordered: false
        })).length;
    } catch (e) {
        // Ignore bulk write errors for duplicate keys
        if (e.code === 11000) {
            return e.result.result.nInserted;
        } else {
            throw e;
        }
    }
}

function getNextPagePromise(resBody = "") {
    // Extract the INNERTUBE_API_KEY for paginating if we haven't found it yet. It'll only be available on the first
    // request as that's an entire page body rather than a JSON response.
    if (!INNERTUBE_API_KEY) {
        INNERTUBE_API_KEY = resBody.match(/"INNERTUBE_API_KEY": ?"([^"]+)"/)[1];
    }

    // Extract the necessary client data for paginating
    if (!INNERTUBE_CLIENT_VERSION) {
        INNERTUBE_CLIENT_VERSION = resBody.match(/"INNERTUBE_CLIENT_VERSION": ?"([^"]+)"/)[1];
    }

    // Continuation token
    const continuationToken = resBody.match(/"continuationCommand": ?{"token": ?"([^"]+)"/)[1];

    // Next page data
    return axios.post('https://www.youtube.com/youtubei/v1/browse', {
        context: {
            "client": {
                "clientName": "WEB",
                "clientVersion": INNERTUBE_CLIENT_VERSION,
            },
        },
        continuation: continuationToken
    }, {
        params: {
            key: INNERTUBE_API_KEY
        }
    });
}

function getPageVideoIDs(resBody = "") {
    let videoMatches = [];

    // Extract all of the video ID fields.
    const myRegexp = new RegExp('"videoId": ?"([^"]+)"', "g");
    let match = myRegexp.exec(resBody);
    while (match != null) {
        if (!videoMatches.includes(match[1]))
            videoMatches.push(match[1]);
        match = myRegexp.exec(resBody);
    }

    return videoMatches;
}