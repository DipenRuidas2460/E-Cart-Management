const mongoose = require("mongoose")
const validators = require("../validators/validator")
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')


const AddToCart = async function (req, res) {
    try {
        let data = req.body
        if (!Object.keys(data).length) { return res.status(400).send({ status: false, message: "Data can't be empty" }) }

        let { item, cartId, productId, totalPrice, totalItems } = data

        totalPrice = 0

        let userId = req.params.userId

        if (!userId) return res.status(400).send({ status: false, message: "userId must be present in params" })
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "User not valid" })
        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: "UserId or user does not exists please register" })
        let oldUserCart = await cartModel.findOne({ userId: userId })
        if (oldUserCart) {
            if (!cartId) return res.status(400).send({ status: false, message: "cartId must be present in request body" })
            if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "cartId not valid" })

            if (!productId) return res.status(400).send({ status: false, message: "productId must be present in request body" })
            if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "productId not valid" })

            let findProduct = await productModel.findById({ _id: productId, isDeleted: false })
            if (!findProduct) return res.status(404).send({ status: false, message: "product does not exists" })

            let cart = await cartModel.findById({ _id: cartId, productId: (findProduct._id) })
            if (!cart) return res.status(404).send({ status: false, message: "cart does not exists" })

            let newItem = cart.item
            // let price = cart.totalPrice + (data.quantity * findProduct.price)
            let list = newItem.map((item)=>item.productId.toString())
            if(list.find((item) => item ==(productId))) {
                let updatedCart = await cartModel.findOneAndUpdate({userId:userId, "item.productId":productId},
                {
                  $inc:{
                    "item.$.quantity":+1,totalPrice:+findProduct.price
                  }
                },{new:true}
                )
                return res.status(200).send({ status: true, message: `Product added successfully`, data:updatedCart})

            }

        }

        if (!item) return res.status(400).send({ status: false, message: "Item must be present in request body" })
        for (let i = 0; i < item.length; i++) {
            if (!item[i].productId) return res.status(400).send({ status: false, message: 'Please provide productId' })
            if (!mongoose.isValidObjectId(item[i].productId)) return res.status(400).send({ status: false, message: 'Please provide valid productId' })
            let productCheck = await productModel.findById({ _id: item[i].productId, isDeleted: false })
            if (!productCheck) return res.status(404).send({ status: false, message: ` product ${item[i].productId} not found` })
            totalPrice = totalPrice + productCheck.price * item[i].quantity
        }

        if (!totalPrice) return res.status(400).send({ status: false, message: "Total Price must be present in request body" })
        if (typeof (totalPrice) != "number") return res.status(400).send({ status: false, message: "please enter totalPrice in number" })

        if (!totalItems) return res.status(400).send({ status: false, message: "Total items must be present in request body" })
        if (!validators.isValidNum(totalItems)) return res.status(400).send({ status: false, message: "please enter totalPrice in number" })

        let value = {
            userId,
            item: item,
            totalPrice,
            totalItems:item.length
        }

        const createCart = await cartModel.create(value)
        return res.status(201).send({ status: true, message: "Cart Created Successfully", cart: createCart })


    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}


module.exports = { AddToCart }




