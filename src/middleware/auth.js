const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");




const authenticate = function (req, res, next) {
    try {
        let token = req.headers["x-api-key"];
        if (!token) token = req.headers["x-Api-key"];
        if (!token) { return res.status(400).send({ status: false, message: "token must be present" }) }

        const decoded = jwt.decode(token);
        if (!decoded) {
            return res.status(401).send({ status: false, message: "Invalid authentication token in request headers ⚠️" })
        }

        jwt.verify(token, "Functionup-Radon", function (err, decoded) {
            if (err) {
                return res.status(401).send({ status: false, message: "invalid token" })
            } else {
                req.body.tokenId = decoded.userId
                return next();
            }
        });
    } catch (err) {
    return res.status(500).send({ message: "Error", error: err.message });
}
};

const authorize = async function (req, res, next) {
    try {
        let token = req.headers["x-api-key"];
        if (!token) token = req.headers["x-Api-key"];
        if (!token) { return res.status(400).send({ status: false, message: "token must be present" }) };

        let decodedToken = jwt.verify(token, "Functionup-Radon");
        let userLoggedIn = decodedToken.userId;

        let bookToBeModified = req.params.bookId

        if (!bookToBeModified) return res.status(400).send({ status: false, message: "Book Id must be present in params" })
        if (!mongoose.isValidObjectId(bookToBeModified)) return res.status(400).send({ status: false, message: "Invalid bookId" })

        let newUserId = await bookModel.findById({_id:bookToBeModified}).select("userId");

        if (!newUserId) return res.status(400).send({ status: false, message: "Please use correct bookId" })

        let user = newUserId.userId

        if (user != userLoggedIn) {
            return res.status(403).send({ status: false, message: "User loggedIn is not allowed to modify the requested  data" })
        };

        next();

    } catch (err) {
        res.status(500).send({ message: "Error", error: err.message });
    }
};

module.exports.authenticate = authenticate;
module.exports.authorize = authorize;