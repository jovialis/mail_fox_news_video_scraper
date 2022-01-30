/**
 * Created by jovialis (Dylan Hanson) on 1/28/22.
 */

const mongoose = require('mongoose');
const nanoid = require('nanoid');

mongoose.model('VideoScraping', new mongoose.Schema({

    _id: {
        type: String,
        default: () => nanoid.nanoid()
    },

    videoId: {
        type: String,
        required: true
    },

    title: String,
    lengthSeconds: String,
    keywords: [String],
    channelId: String,
    shortDescription: String,
    viewCount: String,
    author: String,

    uploadDate: Date,
    publishDate: Date

}, {

    collection: 'videoScrapings',
    timestamps: {
        createdAt: "_docCreatedAt",
        updatedAt: "_docUpdatedAt"
    },

}));