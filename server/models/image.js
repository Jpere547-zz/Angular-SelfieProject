const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const imageSchema = new Schema({
    title: String,
    dataurl: String,
});

module.exports = mongoose.model("image", imageSchema, "images");