const mongoose = require("mongoose")
const validators = require("../validators/validator")
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const orderModel = require("../models/orderModel")


//**************************************** CREATE ORDER *************************************************/

const createOrder = async function (req, res) {

    try {
        let data = req.body
        let userId = req.params.userId

        let createData = {}              // FINAL object to be used to create 
        createData.userId = userId

        //_____________________________________________VALIDATIONS__________________________________________________

        if (!validators.isValidBody(data)) { return res.status(400).send({ status: false, message: "Please Provide input in Request Body" }) }

        //  USER ID 

        if (!userId) return res.status(400).send({ status: false, message: "userId must be present in params" })
        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Invalid userId in params" }) }
        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) { return res.status(404).send({ status: false, message: `user doesn't exists for ${userId}` }) }

        // CART ID 

        if (!data.cartId) return res.status(400).send({ status: false, message: "CartId must be present in request Body" })
        if (!mongoose.isValidObjectId(data.cartId)) { return res.status(400).send({ status: false, message: "Invalid cartId" }) }
        let searchCart = await cartModel.findOne({ _id: data.cartId, userId: userId })
        if (!searchCart) { return res.status(404).send({ status: false, message: `cart doesn't exists` }) }
        
        if(searchCart.items.length == 0 ){return res.status(400).send({status:false,message:"Your Cart is Empty. You can't proceed further"})}

        createData.items = searchCart.items
        createData.totalPrice = searchCart.totalPrice
        createData.totalItems = searchCart.totalItems

        let totalQuantity = 0


        for (let i = 0; i < searchCart.items.length; i++) {
            let productCheck = await productModel.findById(searchCart.items[i].productId)
            if (!productCheck) return res.status(404).send({ status: false, message: `product not found` })
            if (productCheck.isDeleted == true) return res.status(404).send({ status: false, message: `This product is deleted` })

            totalQuantity = totalQuantity + searchCart.items[i].quantity
            createData.totalQuantity = totalQuantity
        }
        if (data.cancellable) {
            if (typeof (cancellable) !== "boolean") return res.status(400).send({ status: false, message: "Cancellable is only Boolean value" })
        }

        

        let OrderData = await orderModel.create(createData)
        OrderData = await OrderData.populate("items.productId",{_id:1,title:1,price:1,productImage:1})
        
        let updatedCartData = {}

        if(!Object.prototype.hasOwnProperty.call(updatedCartData,'$set')) {
            updatedCartData['$set'] = {}
        }
        updatedCartData['$set']['items'] = []


        if(!Object.prototype.hasOwnProperty.call(updatedCartData,'$set')) {
            updatedCartData['$set'] = {}
        }
        updatedCartData['$set']['totalPrice'] = 0


        if(!Object.prototype.hasOwnProperty.call(updatedCartData,'$set')) {
            updatedCartData['$set'] = {}
        }
        updatedCartData['$set']['totalItems'] = 0

        await cartModel .findOneAndUpdate({userId:userId},updatedCartData,{new:true})
        
        return res.status(201).send({ status: true, message: "Successfully Order Placed", Order: OrderData })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }

}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



//**********************************************   UPDATE ORDER ****************************************************** */


const updateOrder = async function (req, res) {
    try {
        let data = req.body
        let userId = req.params.userId

        let { orderId, status } = data

        //empty body validation

        if (!validators.isValidBody(data)) { return res.status(400).send({ status: false, message: "Please Provide input in Request Body" }) }

        // userId validation
        if (!userId) { return res.status(400).send({ status: false, message: "please mention userId in params" }) }

        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Invalid userId in params" }) }

        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) { return res.status(404).send({ status: false, message: `user doesn't exists for ${userId}` }) }

        //orderId validation

        if (!orderId) return res.status(400).send({ status: false, message: "please mention order id" })

        if (!mongoose.isValidObjectId(orderId)) { return res.status(400).send({ status: false, message: "OrderId is not valid" }) }


        //verifying does the order belong to user or not.

        let isOrder = await orderModel.findOne({ userId:userId, _id:orderId});
        if (!isOrder) {
            return res.status(404).send({ status: false, message: `No such order  belongs to ${userId} ` });
        }
        // cancellable validation 

        if (isOrder.cancellable == false) {
            if(status == "completed" && isOrder.status=="pending"){
                const updateorderStatus = await orderModel.findOneAndUpdate(
                    { _id: isOrder._id },
                    { $set:{status:status} },
                    { new: true }).populate("items.productId",{_id:1,title:1,price:1,productImage:1})
                return res.status(200).send({ status: true, message: `Successfully updated the order details.`, data: updateorderStatus })
            
            }
            return res.status(400).send({ status: false, message: "You can not cancel this order" })
        }
        if (isOrder.status == "completed") return res.status(400).send({ status: false, message: "You can not change status now it is completed." })
        if (isOrder.status == "cancled") return res.status(400).send({ status: false, message: "your order is cancled, place order again." })
        //status validations


        if (!status) {
            return res.status(400).send({ status: false, message: "Please enter  status of order to be updated ." });
        }


        if (!validators.isValidStatus(status)) {
            return res.status(400).send({ status: false, message: "Invalid status in request body. Choose either 'pending','completed', or 'cancled'." });
        }
        if (status == "pending") { return res.status(400).send({ status: false, message: "Your order is already pending" }); }

        let updated = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true }).populate("items.productId",{_id:1,title:1,price:1,productImage:1})
        return res.status(200).send({ status: true, message: "update successfull", data: updated })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}


module.exports = { createOrder, updateOrder }