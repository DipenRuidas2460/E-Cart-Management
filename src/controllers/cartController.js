const mongoose = require("mongoose")
const validators = require("../validators/validator")
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')


//****************************************  CREATE CART API********************************************* */

const AddToCart = async function (req, res) {

    try {
        let data = req.body
        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "Data can't be empty" })

        let createData = {}

        let userId = req.params.userId

        createData.userId = userId

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  VALIDATIONS  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//


         // USER ID

        if (!userId) return res.status(400).send({ status: false, message: "userId must be present in params" })
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "User not valid" })
        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: "UserId or user does not exists please register" })

        // PRODUCT ID
        if (!data.productId) return res.status(400).send({ status: false, message: 'Please provide productId' })
        if (!mongoose.isValidObjectId(data.productId)) return res.status(400).send({ status: false, message: 'Please provide valid productId' })
        let productCheck = await productModel.findById(data.productId)
        if (!productCheck) return res.status(404).send({ status: false, message: ` product ${data.productId} not found` })
        if (productCheck.isDeleted == true) return res.status(404).send({ status: false, message: `${data.productId} this product is deleted` })
 
        // QUANTITY
        if (data.quantity || data.quantity == "") {
            if (!/^[0-9]+$/.test(data.quantity)) return res.status(400).send({ status: false, message: "Quantity should be a valid number" })
        }
        let reqItems = [{
            productId: data.productId,
            quantity: data.quantity || 1
        }]
        createData.totalPrice = productCheck.price * (data.quantity || 1)
        createData.totalItems = 1

        createData.items = reqItems

        // CART ID
        if (data.cartId || data.cartId == "") {
            if (!mongoose.isValidObjectId(data.cartId)) return res.status(400).send({ status: false, message: 'Please provide valid userId' })
            let cartCheck = await cartModel.findOne({ _id: data.cartId, userId: userId })
            if (!cartCheck) return res.status(404).send({ status: false, message: "no cart found" })
        }

        let findCart = await cartModel.findOne({ userId: userId })

        if (findCart || data.cartId) {
            let newItem = findCart.items

            let list = newItem.map((item) => item.productId.toString())
            if (list.find((item) => item == (data.productId))) {
                let updatedCart = await cartModel.findOneAndUpdate({ userId: userId, "items.productId": data.productId },
                    {
                        $inc: {
                            "items.$.quantity": data.quantity || 1, totalPrice: createData.totalPrice
                        }
                    }, { new: true }
                )
                return res.status(200).send({ status: true, message: `Product added successfully`, data: updatedCart })

            }
            // ___________________________final update _________________________________________________________//


            const updateData = await cartModel.findOneAndUpdate(
                { userId: userId },
                { $inc: { totalPrice: createData.totalPrice, totalItems: createData.totalItems }, $push: { items: createData['items'] } },
                { new: true })
            return res.status(200).send({ status: true, message: "success", data: updateData })

        } else {
            const result = await cartModel.create(createData)
            return res.status(201).send({ status: true, message: "Success", data: result })
        }

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}
//==========================================================================================================================//

//********************************** UPDATE CART API ************************************************************ */

const updateCart = async function (req, res) {
    try {
        let data = req.body

        //______________VALIDATIONS____________________//

        //empty body validation

        if (!Object.keys(data).length) { return res.status(400).send({ status: false, message: "Data can't be empty" }) }

        const { cartId, productId, removeProduct } = data

        // CartId Validation

        if (!cartId) return res.status(400).send({ status: false, message: "please mention cartID" })


        if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "please mention valid cartID" })

        let cart = await cartModel.findById({ _id: cartId })

        if (!cart) { return res.status(404).send({ status: false, message: "No such cart found" }) }

        if (cart.items.length == 0) { return res.status(400).send({ status: false, message: "nothing to delete in item " }) }

        //productId validation

        if (!productId) return res.status(400).send({ status: false, message: "please mention productID" })

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "please mention valid productID" })

        let product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) { return res.status(404).send({ status: false, message: "No such product found in cart " }) }

        if (!(removeProduct == 1 || removeProduct == 0)) return res.status(400).send({ status: false, message: "please mention 1 or 0 only in remove product" })



        //****************** if remove product : 1 ***************/

        if (removeProduct == 1) {

            var pro = cart.items                                             // items array

            for (let i = 0; i < pro.length; i++) {

                if (pro[i].productId == productId) {

                    let dec = pro[i].quantity - 1                            // decreasing quantity of product -1

                    pro[i].quantity = dec

                    var cTotalPrice = cart.totalPrice - product.price;       // updated total price

                    if (pro[i].quantity == 0) {
                        pro.splice(i, 1)
                        var ded = cart.totalItems - 1
                        var cTotalItems = ded                               // only  if item quantity will become zero, totalItems 
                    }                                                        // will -1

                    break;

                }                                                 // it will return item array  after changes
            }

            if (pro.length == 0) { cTotalPrice = 0; cTotalItems = 0 };        // if there will be no item in cart 

            let updated = await cartModel.findOneAndUpdate({ _id: cartId }, { items: pro, totalPrice: cTotalPrice, totalItems: cTotalItems }, { new: true })

            return res.status(200).send({ status: true, message: "update successfull", data: updated })

        }

        //************** if remove product : 0 ************** *******/

        if (removeProduct == 0) {

            var pro = cart.items                                                             // array of items

            for (let i = 0; i < pro.length; i++) {

                if (pro[i].productId == productId)

                    var cTotalPrice = cart.totalPrice - (product.price * pro[i].quantity)      //deducting products price from total price


                var cTotalItems = cart.totalItems - 1                            // decreasing totalItems quantity by 1

                pro.splice(i, 1)                                                  // deleting product from items array

                break;
            }

        }
        if (pro.length == 0) { cTotalPrice = 0; cTotalItems = 0 };             // if items array will become empty

        let updated = await cartModel.findOneAndUpdate({ _id: cartId }, { items: pro, totalPrice: cTotalPrice, totalItems: cTotalItems }, { new: true })                                                         // updated

        return res.status(200).send({ status: true, message: "update successfull", data: updated })
    }

    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message })

    }


}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const getCart = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!userId) return res.status(400).send({ status: false, message: "userId must be present in params" })

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Enter valid userId" })
        }

        const findUser = await userModel.findById(userId)
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User Not Found" })
        }
        const findCart = await cartModel.findOne({ userId: userId })

        if (!findCart) {
            return res.status(404).send({ status: false, message: `Cart doesn't exists by this ${userId} ` })
        }

        return res.status(200).send({ status: true, message: "Successfully fetched cart.", data: findCart })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



//***************************************** DELETE CART ********************************************************** */

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!userId) return res.status(400).send({ status: false, message: "userId must be present in params" })

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "invalid userId in param" })
        }

        let Userdata = await userModel.findOne({ _id: userId })
        if (!Userdata) {
            return res.status(404).send({ status: false, message: "No such user exists with this userID" });
        }

        let usercart = await cartModel.findOne({ userId: userId })
        if (!usercart) {
            return res.status(404).send({ status: false, message: "No such user found. Please register and try again" });
        }
        let updatedUserCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })
        return res.status(200).send({ status: true, message: "Cart deleted successfully" })


    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

module.exports = { AddToCart, updateCart, getCart, deleteCart }






