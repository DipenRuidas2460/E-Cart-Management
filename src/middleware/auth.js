const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const authenticate = function (req, res, next) {
    try {
        const token = req.header('Authorization', 'Bearer Token')
        if (!token) { return res.status(401).send({ status: false, message: `Missing authentication token in request` }) }
        let splitToken = token.split(' ')
        let decodedToken = jwt.decode(splitToken[1])
        if (!decodedToken) { return res.status(403).send({ status: false, message: `Invalid authentication token in request ` }) }

        jwt.verify(splitToken[1], "project_5", function (err) {
            if (err) return res.status(401).send({ status: false, message: "invalid token" })
            return next()
        });

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const authorize = async function (req, res, next) {
    try {
        const token = req.header('Authorization', 'Bearer Token')
        if (!token) { return res.status(401).send({ status: false, message: `Missing authentication token in request` }) }

        let splitToken = token.split(' ')
        let decodedToken = jwt.verify(splitToken[1],"project_5")

        let userLoggedIn = decodedToken.userId
        let userToBeModified = req.params.userId

        if (!userToBeModified) return res.status(400).send({ status: false, message: "User Id must be present in params" })

        if (!mongoose.isValidObjectId(userToBeModified)) return res.status(400).send({ status: false, message: "Invalid userId" })

        let newUserId = await userModel.findById({ _id: userToBeModified })

        if (!newUserId) return res.status(404).send({ status: false, message: "No such User Present" })

        let user = newUserId._id

        if (user != userLoggedIn) {
            return res.status(403).send({ status: false, message: "You are not authorized to do this" })
        };

        next();

    } catch (err) {
        res.status(500).send({ message: "Error", error: err.message });
    }
};



module.exports.authenticate = authenticate
module.exports.authorize = authorize