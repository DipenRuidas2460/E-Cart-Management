const mongoose = require("mongoose")
const validators = require("../validators/validator")
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')


const AddToCart = async function (req, res) {
    try {
        let data = req.body
        let userId = data.userId
        if (!Object.keys(data).length) { return res.status(400).send({ status: false, message: "Data can't be empty" }) }
        
        // UserId Validation
        if (!userId) return res.status(400).send({ status: false, message: "Data can't be empty" }) 
                

    } catch (err) {

    }
}