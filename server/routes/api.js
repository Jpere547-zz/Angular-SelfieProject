const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const Image = require("../models/image");
const jwt = require("jsonwebtoken");
const db =
    "mongodb+srv://jpdesign:FYHuXsoOoyz5NGIr@cluster0.jwlqm.mongodb.net/Low5Selfie?retryWrites=true&w=majority";

mongoose.connect(db, function(err) {
    if (err) {
        console.error("Error! " + err);
    } else {
        console.log("Connected to mongodb");
    }
});

function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send("Unauthorized request");
    }
    let token = req.headers.authorization.split(" ")[1];
    if (token === "null") {
        return res.status(401).send("Unauthorized request");
    }
    let payload = jwt.verify(token, "secretKey");
    if (!payload) {
        return res.status(401).send("Unauthorized request");
    }
    req.userId = payload.subject;
    next();
}

router.get("/gallery", verifyToken, (req, res) => {
    // GET LOCAL DATA DB
    let coll = mongoose.connection;
    Image.find({}, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
});

router.post("/gallery", verifyToken, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let cameraSnapshot = req.body;
    let image = new Image(cameraSnapshot);
    // POST DATA & LOCAL DB
    image.save((err, image) => {
        if (err) {
            console.log(err);
        } else {
            let payload = {
                subject: image._id,
            };
            let token = jwt.sign(payload, "secretKey");
            res.status(200).send({ token });
        }
    });
});

router.post("/register", [check("email").isEmail()], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let userData = req.body;
    User.findOne({ email: userData.email }, function(err, user) {
        if (err) {
            console.log(err);
        }
        if (user) {
            return res.status(409).json({ errors: "User Already Exists!" });
        } else {
            let user = new User(userData);
            user.save((err, registeredUser) => {
                if (err) {
                    console.log(err);
                } else {
                    let payload = { subject: registeredUser._id };
                    let token = jwt.sign(payload, "secretKey");
                    res.status(200).send({ token });
                }
            });
        }
    });
});

router.post("/login", (req, res) => {
    let userData = req.body;
    User.findOne({ email: userData.email }, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            if (!user) {
                res.status(401).send("Invalid Email");
            } else if (user.password !== userData.password) {
                res.status(401).send("Invalid Password");
            } else {
                let payload = { subject: user._id };
                let token = jwt.sign(payload, "secretKey");
                res.status(200).send({ token });
            }
        }
    });
});

module.exports = router;