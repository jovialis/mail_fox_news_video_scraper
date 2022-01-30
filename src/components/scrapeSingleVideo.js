/**
 * Created by jovialis (Dylan Hanson) on 1/28/22.
 */

module.exports = scrapeSingleVideo;

const MAX_RETRIES = 5;

const axios = require('axios');

const mongoose = require('mongoose');
const VideoScraping = mongoose.model('VideoScraping');

async function scrapeSingleVideo(vid, iteration = 0) {
    try {
        const res = await axios.get(`https://www.youtube.com/watch?v=${vid}`);

        let initialState = res.data.match(/<script nonce="[^"]*">var ytInitialPlayerResponse = ((?:(?:.|\n)(?!<\/script>))+);<\/script>/)[1];
        initialState = JSON.parse(initialState);

        const videoDetails = initialState.videoDetails;
        const microformat = initialState.microformat.playerMicroformatRenderer;

        const combinedDetails = {
            ...microformat,
            ...videoDetails,
        }

        console.log(`"${combinedDetails.title}" [${combinedDetails.videoId}] by ${combinedDetails.author} on ${microformat.publishDate}: ${combinedDetails.viewCount} Views`)

        // Create the actual document.
        await VideoScraping.create(combinedDetails);

    } catch (e) {
        if (iteration >= MAX_RETRIES) {
            console.log(`Something went wrong scraping video ${vid}... No more retries allowed.`);
        } else {
            console.log(`Something went wrong scraping video ${vid}... Retrying (${iteration + 1} / ${MAX_RETRIES}).`);
            return await scrapeSingleVideo(vid, iteration + 1);
        }
    }
}