const mongoose = require("mongoose")
const validators = require("../validators/validator")
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const orderModel = require("../models/orderModel")


const createOrder = async function (req, res) {
    try {
        let data = req.body
        let userId = req.param.userId

        let { items, totalPrice, totalItems, totalQuantity } = data

        if (!validators.isValidBody(data)) { return res.status(400).send({ status: false, message: "Please Provide input in Request Body" }) }

        if (!userId) return res.status(400).send({ status: false, message: "userId must be present in params" })
        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, msg: "Invalid userId in params" }) }
        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) { return res.status(400).send({ status: false, message: `user doesn't exists for ${userId}` }) }

        if (!items) return res.status(400).send({ status: false, message: "items must be present in request Body" })

        if (!data.productId) return res.status(400).send({ status: false, message: 'Please provide productId' })
        if (!mongoose.isValidObjectId(data.productId)) return res.status(400).send({ status: false, message: 'Please provide valid productId' })
        let productCheck = await productModel.findById(data.productId)
        if (!productCheck) return res.status(404).send({ status: false, message: ` product ${data.productId} not found` })
        if (productCheck.isDeleted == true) return res.status(404).send({ status: false, message: `${data.productId} this product is deleted` })

        if (data.quantity || data.quantity == "") {
            if (!/^[0-9]+$/.test(data.quantity)) return res.status(400).send({ status: false, message: "Quantity should be a valid number" })
        }
    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }

}


const updateOrder = async function (req, res) {
    try {
        data = req.body
        userId = req.param.userId

        const { orderId, status } = data

        //empty body validation

        if (!validators.isValidBody(data)) { return res.status(400).send({ status: false, message: "Please Provide input in Request Body" }) }

        // userId validation
        if (!userId) { return res.status(400).send({ status: false, msg: " please mention userId in params" }) }

        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, msg: "Invalid userId in params" }) }

        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) { return res.status(400).send({ status: false, message: `user doesn't exists for ${userId}` }) }

        //orderId validation

        if (!orderId) return res.status(400).send({ status: false, msg: "please mention order id" })

        if (!mongoose.isValidObjectId(orderId)) { return res.status(400).send({ status: false, msg: "OrderId is not valid" }) }


        //verifying does the order belong to user or not.

        let isOrder = await orderModel.findOne({ userId: userId });
        if (!isOrder) {
            return res.status(400).send({ status: false, message: `No such order  belongs to ${userId} ` });
        }
        // cancellable validation 

        if (isOrder.cancellable == false) return res.status(400).send({ status: false, msg: "You can not cancel this order" })

        //status validations


        if (!status) {
            return res.status(400).send({ status: false, message: " Please enter current status of the order." });
        }


        if (!validators.isValidStatus(status)) {
            return res.status(400).send({ status: false, message: "Invalid status in request body. Choose either 'pending','completed', or 'cancelled'." });
        }

        let updated = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })
        return res.status(200).send({ status: true, message: "update successfull", data: updated })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}


module.exports = { createOrder, updateOrder }