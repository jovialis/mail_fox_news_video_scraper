/**
 * Created by jovialis (Dylan Hanson) on 1/30/22.
 */

const mongoose = require('mongoose');
const config = require('./config');

(async function() {

    // Init DB connection and register models.
    await mongoose.connect(config.MONGODB_URI);
    require('./models/Video');
    require('./models/VideoScraping');

    // Represents a discovered video
    const Video = await mongoose.model('Video');

    const discoverRecentVideos = require('./components/discoverRecentVideos');
    let count;

    // If no videos yet? Do a single page discovery to get us started.
    if ((await Video.countDocuments({})) === 0) {
        console.log('No existing Videos found. Executing single-page search to seed database.');
        count = await discoverRecentVideos(0);
    } else {
        console.log('Existing Videos found. Executing backfill to identify new videos.');
        count = await discoverRecentVideos();
    }

    console.log(`Discovered and inserted ${count} new videos.`);

    // Now, we need to update our existing videos.
    const scrapeSingleVideo = require('./components/scrapeSingleVideo');

    const existingVideos = await Video.find({}).lean();
    console.log(existingVideos.length);

    for (const video of existingVideos) {
        await scrapeSingleVideo(video._id);
    }

})().then(() => {
    process.exit();
}).catch(console.log);