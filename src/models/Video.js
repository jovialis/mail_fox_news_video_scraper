/**
 * Created by jovialis (Dylan Hanson) on 1/28/22.
 */

const mongoose = require('mongoose');

mongoose.model('Video', new mongoose.Schema({

    _id: {
        type: String,
    },

}, {

    collection: 'videos',
    timestamps: {
        createdAt: "_docCreatedAt",
        updatedAt: "_docUpdatedAt"
    },

}));