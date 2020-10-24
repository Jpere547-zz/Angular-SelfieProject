const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const imageSchema = new Schema({
    imageURL: String,
    imageTitle: String,
    userID: String,
});

module.exports = mongoose.model("image", imageSchema, "images");