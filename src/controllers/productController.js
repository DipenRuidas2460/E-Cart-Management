const productModel = require("../models/productModel")
const validators = require("../validators/validator")
const mongoose = require("mongoose")
const aws = require('../aws/aws');
const currencySymbol = require("currency-symbol-map")



const createProduct = async function (req, res) {
    try {
        let data = req.body;
        let files = req.files;
        if (!validators.isValidBody(data)) return res.status(400).send({ status: false, message: "Please Provide input in request body" })

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        //TITLE
        if (!title) return res.status(400).send({ status: false, message: "Title is required" });
        if (!validators.isValid(title)) return res.status(400).send({ status: false, message: "Title is not valid string" });
        let productTitle = await productModel.findOne({ title })
        if (productTitle) return res.status(400).send({ status: false, message: "Product title is already exists" })

        //DESCRIPTION
        if (!description) return res.status(400).send({ status: false, message: "Description is required" })
        if (!validators.isValid(description)) return res.status(400).send({ status: false, message: "description is not valid string" });
        // if ((description).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from description" }); }

        //PRICE
        if (!price) return res.status(400).send({ status: false, message: "Price is required" })
        if ((price).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from price" }); }
        if (!validators.isValidPrice(price)) return res.status(400).send({ status: false, message: "Please Provide Valid price(price should be Number/Decimal)" })

        //CURRENCY id
        if (!currencyId) return res.status(400).send({ status: false, message: "currencyId is required" })
        if (!validators.isValid(currencyId)) return res.status(400).send({ status: false, message: "currencyId is not valid and It should be INR" });
        // if (currencyId != "INR") return res.status(400).send({ status: false, message: "currencyId should be INR" })

        // Currerce format
        if (!currencyFormat) return res.status(400).send({ status: false, message: "currencyFormat must be present" })

        if (!validators.isValid(currencyFormat)) {
            currencyFormat = currencySymbol('INR')
        }
        currencyFormat = currencySymbol('INR') //used currency symbol package to store INR symbol.

        //  isFreeShipping
        if (isFreeShipping) {
            isFreeShipping = isFreeShipping.toLowerCase();
            if (isFreeShipping == 'true' || isFreeShipping == 'false') {
                isFreeShipping = JSON.parse(isFreeShipping);      //convert from string to boolean
            } else {
                return res.status(400).send({ status: false, message: "Enter a valid value for isFreeShipping" })
            }
            if (typeof isFreeShipping != "boolean") return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })

        }

        //PRODUCT IMAGE

        if (!files || files.length === 0) return res.status(400).send({ status: false, message: "No data found" })
        let uploadedFileURL = await aws.uploadFile(files[0])
        data.productImage = uploadedFileURL
        if (!/(\.jpg|\.jpeg|\.bmp|\.gif|\.png)$/i.test(data.productImage)) return res.status(400).send({ status: false, message: "Please provide profileImage in correct format like jpeg,png,jpg,gif,bmp etc" })


        //STYLE
        if (style) {
            if (!validators.isValid(style)) {
                return res.status(400).send({ status: false, message: "style is required" })
            }
        }
        //INSTALLMENTS   

        if (installments) {
            if (!validators.isValidNum(installments)) return res.status(400).send({ status: false, message: "installments not valid " })
            if (!validators.isValid(installments)) return res.status(400).send({ status: false, message: "installments required" })

        }

        //AVAILABLESIZES

        if (!availableSizes) return res.status(400).send({ status: false, message: "AvailableSize is required" })

        if (!(validators.isValid(availableSizes))) return res.status(400).send({ status: false, message: "Please provide availableSize" })
        if (availableSizes.toUpperCase().trim().split(",").map(value => validators.isValidEnum(value)).filter(item => item == false).length !== 0) {
            return res.status(400).send({ status: false, message: "Enum should be valid" })
        }

        const availableSize = availableSizes.toUpperCase().trim().split(",").map(value => value.trim()) //converting in array
        availableSizes = availableSize

        let savedProductData = await productModel.create(data);
        return res.status(201).send({ status: true, message: "Product created successfully", data: savedProductData, });


    } catch (err) {
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}

const getProduct = async function (req, res) {
    try {
        let data = req.query

        if (!Object.keys(data).length) {
            let data = await productModel.find({ isDeleted: false }).sort({ price: 1 });
            return res.status(200).send({ status: true, data: data })
        };

        let { size, name, priceGreaterThan, priceLessThan } = data

        /// size validation //
        let Get = {}
        if (size) {
            if ({ size: { $nin: ["S", "XS", "M", "X", "L", "XXL", "XL"] } }) {

                return res.status(400).send({ status: false, message: "enter correct size" })
            }
            Get.availableSizes = size
        }
        // name validation//

        if (name) {
            if (!validators.isValid(name)) return res.status(400).send({ status: false, message: "Please enter correct name" })
            Get.title = /^`${name}`/
        }
        //price validation //
        if (priceGreaterThan) {
            if (typeof priceGreaterThan != "number") return res.status(400).send({ status: false, message: "Please enter price in number" })
            Get.price = { $gt: `${priceGreaterThan}` }
        }
        if (priceLessThan) {
            if (typeof priceLessThan != "number") return res.status(400).send({ status: false, message: "Please enter price in number" })
            Get.price = { $lt: `${priceLessThan}` }
        }

        if (priceGreaterThan && priceLessThan) {
            Get.price = { $gt: `${priceGreaterThan}`, $lt: `${priceLessThan}` }
        }

        let result = await productModel.find(Get).sort({ price: 1 })
        if (result.length == 0) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        res.status(200).send({ status: true, data: result })


    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}


const getProductByParams = async function (req, res) {
    try {
        const productId = req.params
        if (!mongoose.isValidObjectId(productId)) {
            res.status(400).send({ status: false, message: "Enter valid productId" })
        }

        const data = await productModel.findById({ _id: productId })
        if (!data) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        let dataa = data.filter((x) => x.isDeleted == false)
        res.status(200).send({ status: true, data: dataa })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }

}


const updateProduct = async function (req, res) {
    try {
        let data = req.body
        let productId = req.params.productId
        let files = req.files

        if (!(Object.keys(data).length || files)) return res.status(400).send({ status: false, message: "Please provide some data for update" })

        if (!productId) return res.status(400).send({ status: false, message: "Please provide productId in params" })

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "productId is not valid" })

        const findUserProfile = await productModel.findById({ _id: productId })
        if (!findUserProfile) return res.status(404).send({ status: false, message: "productId does not exists" })

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        let update = {}


        //TITLE
        if (title) {
            if (!validators.isValid(title)) return res.status(400).send({ status: false, message: "Title is not valid string" });
            let productTitle = await productModel.findOne({ title })
            if (productTitle) return res.status(400).send({ status: false, message: "Product title is already exists" })
            update.title = title
        }

        //DESCRIPTION
        if (description) {
            if (!validators.isValid(description)) return res.status(400).send({ status: false, message: "description is not valid string" });
            update.description = description
        }
        //PRICE
        if (price) {
            if ((price).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from price" }); }
            if (!validators.isValidPrice(price)) return res.status(400).send({ status: false, message: "Please Provide Valid price(price should be Number/Decimal)" })
            update.price = price
        }
        //CURRENCY id

        if (currencyId) {
            if (!validators.isValid(currencyId)) return res.status(400).send({ status: false, message: "currencyId is not valid and It should be INR" });
            // if (currencyId != "INR") return res.status(400).send({ status: false, message: "currencyId should be INR" })
            update.currencyId = currencyId
        }

        // Currerce format
        if (currencyFormat) {
            if (!validators.isValid(currencyFormat)) {
                currencyFormat = currencySymbol('INR')
            }
            currencyFormat = currencySymbol('INR')  //used currency symbol package to store INR symbol.
            update.currencyFormat = currencyFormat
        }

        //  isFreeShipping
        if (isFreeShipping) {
            isFreeShipping = isFreeShipping.toLowerCase();
            if (isFreeShipping == 'true' || isFreeShipping == 'false') {
                isFreeShipping = JSON.parse(isFreeShipping);      //convert from string to boolean
            } else {
                return res.status(400).send({ status: false, message: "Enter a valid value for isFreeShipping" })
            }
            if (typeof isFreeShipping != "boolean") return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })
            update.isFreeShipping = isFreeShipping
        }

        //PRODUCT IMAGE

        if (files && files.length > 0) {
            if (!/(\.jpg|\.jpeg|\.bmp|\.gif|\.png)$/i.test(data.profileImage)) return res.status(400).send({ status: false, message: "Please provide profileImage in correct format like jpeg,png,jpg,gif,bmp etc" })
            let uploadedFileURL = await aws.uploadFile(files[0])
            update.productImage = uploadedFileURL
        }


        //STYLE
        if (style) {
            if (!validators.isValid(style)) return res.status(400).send({ status: false, message: "style is required" })
            update.style = style
        }
        //INSTALLMENTS   

        if (installments) {
            if (!validators.isValidNum(installments)) return res.status(400).send({ status: false, message: "installments not valid " })
            if (!validators.isValid(installments)) return res.status(400).send({ status: false, message: "installments required" })
            update.installments = installments
        }

        //AVAILABLESIZES
        if (availableSizes) {
            if (!(validators.isValid(availableSizes))) return res.status(400).send({ status: false, message: "Please provide availableSize" })
            if (availableSizes.toUpperCase().trim().split(",").map(value => validators.isValidEnum(value)).filter(item => item == false).length !== 0)
                return res.status(400).send({ status: false, message: "Enum should be valid" })

            const availableSize = availableSizes.toUpperCase().trim().split(",").map(value => value.trim()) //converting in array
            availableSizes = availableSize

            update.availableSizes = availableSizes
        }

        let updatedProduct = await productModel.findByIdAndUpdate({ _id: userId }, update, { new: true })
        return res.status(200).send({ status: true, message: "Product updated Successfully", data: updatedProduct })


    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message })
    }


}


const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId;
        if (!productId) return res.status(400).send({ status: false, message: " ProductId must be present." });
        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: " ProductId is invalid." });

        let data = await productModel.findById({ _id: productId });
        if (!data) return res.status(404).send({ status: false, message: "No such product found" })

        if (data.isDeleted == true) return res.status(404).send({ status: false, message: "Product data already deleted" })

        let Update = await productModel.findByIdAndDelete({ _id: productId }, { isDeleted: true, deletedAt: Date.now() }, { new: true });
        console.log(Update)
        return res.status(200).send({ status: true, message: "successfully deleted product", });
    } catch (err) {
        res.status(500).send({ status: false, Error: err.message });
    }
}




module.exports = { createProduct, getProduct, getProductByParams, updateProduct, deleteProduct }
