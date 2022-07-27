const userModel = require("../models/userModel")
const validators = require("../validators/validator")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const aws = require('../aws/aws');
const bcrypt = require('bcrypt');

const createUser = async function (req, res) {
    try {
        let userData = req.body;
        if (!Object.keys(userData).length) { return res.status(400).send({ status: false, message: "UserData can't be empty" }) }

        let files = req.files

        if (!files || files.length === 0) return res.status(400).send({ status: false, message: "No data found" })
        
        let uploadedFileURL = await aws.uploadFile(files[0])
        userData.profileImage = uploadedFileURL


        let { fname, lname, email, phone, password, address } = userData

        // fname Validation:-

        if (!(fname)) { return res.status(400).send({ status: false, message: "fname is required." }); }
        if (!validators.isValid(fname)) return res.status(400).send({ status: false, message: "Please include correct fname" });
        if ((fname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from fname" }); }

        // lname Validation:-

        if (!(lname)) { return res.status(400).send({ status: false, message: "lname is required." }); }
        if (!validators.isValid(lname)) return res.status(400).send({ status: false, message: "Please include correct lname" });
        if ((lname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from lname" }); }

        // email Validation:-

        if (!email) { return res.status(400).send({ status: false, message: "Please include an email" }) };
        if (typeof (email) != "string") return res.status(400).send({ status: false, message: "Please use correct EmailId" })
        if (!validators.isValidEmail(email)) return res.status(400).send({ status: false, message: "Email is invalid." })
        if ((email).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in email" }); }
        let OldEmail = await userModel.findOne({ email })
        if (OldEmail) return res.status(400).send({ status: false, message: "email already exists" })

        // phone Validation:-

        if (!phone) return res.status(400).send({ status: false, message: "phone number must be present" })
        if (!validators.isValidMobile(phone)) return res.status(400).send({ status: false, message: "Phone number is invalid." })
        if (typeof (phone) != "string") { return res.status(400).send({ status: false, message: "provide phone no. in string." }); }
        if ((phone).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from phone number" }); }
        const uniqueMobile = await userModel.findOne({ phone })
        if (uniqueMobile) return res.status(400).send({ status: false, message: "Phone number already exists." })

        // password Validation:-

        if (!password) { return res.status(400).send({ status: false, message: "Please include a password" }) };
        if (typeof (password) != "string") { return res.status(400).send({ status: false, message: "Provide password  in String" }); }
        if ((password).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in password" }); }
        if (!((password.length >= 8) && (password.length < 15))) { return res.status(400).send({ status: false, message: "Password should be in 8-15 character" }) }

        let protectedPassword = await bcrypt.hash(password, 10)
        userData.password = protectedPassword

        // Address Validation:-

        // console.log(userData["address"])

        if (!address) return res.status(400).send({ status: false, message: "Address can't be empty" })

        try {
            if (typeof address === "string") { address = JSON.parse(address) }
        } catch (error) {
            return res.status(400).send({status:false,message:"Please enter Pincode in correct format"})
        }

        if (!Object.keys(address).length) { return res.status(400).send({ status: false, message: "Please provide somedata in address" }); }

        if (!address.shipping) return res.status(400).send({ status: false, message: "Shipping Address can't be empty" })
        if (!Object.keys(address.shipping).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Shipping address" }); }

        else {
            if (!(address.shipping.street)) return res.status(400).send({ status: false, message: "street can't be empty" })
            if ((typeof (address.shipping.street) !== "string")||(address.shipping.street=="")) return res.status(400).send({ status: false, message: "Provide street name in string format or enter some data" })
            if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.shipping.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

            if (!(address.shipping.city)) return res.status(400).send({ status: false, message: "city can't be empty" })
            if (!validators.isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "city address is not valid address" });


            if (!(address.shipping.pincode)) return res.status(400).send({ status: false, message: "pincode can't be empty" })
            else {
                if (!(/^[1-9][0-9]{5}$/.test(address.shipping.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                
            }
        }


        if (!address.billing) return res.status(400).send({ status: false, message: "Billing Address can't be empty" })
        if (!Object.keys(address.billing).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Billing address" }); }

        else {
            if (!address.billing.street) return res.status(400).send({ status: false, message: "street can't be empty" })
            if ((typeof (address.billing.street) !== "string")||(address.billing.street=="")) return res.status(400).send({ status: false, message: "Provide street name in string format or enter some data" })
            if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.billing.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

            if (!address.billing.city) return res.status(400).send({ status: false, message: "city can't be empty" })
            if (!validators.isValid(address.billing.city)) return res.status(400).send({ status: false, message: "city address is not valid address" });

            if (!address.billing.pincode) return res.status(400).send({ status: false, message: "pincode can't be empty" })
            else {
                if (!(/^[1-9][0-9]{5}$/.test(address.billing.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                
            }


        }

        userData.address = address

        let savedData = await userModel.create(userData);
        res.status(201).send({ status: true, message: 'User created successfully', data: savedData })


    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
};

const loginUser = async function (req, res) {
    try {
        let data = req.body
        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "Please enter details" })

        const { email, password } = data

        if (!email) return res.status(400).send({ status: false, message: "Please enter email" })
        if (!validators.isValidEmail(email)) return res.status(400).send({ status: false, message: "Provide valid email" })

        if (!password) return res.status(400).send({ status: false, message: "Please enter password" })
        if (typeof (password) != "string") { return res.status(400).send({ status: false, message: "Provide password  in String" }); }
        if ((password).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in password" }); }
        if (!((password.length >= 8) && (password.length < 15))) { return res.status(400).send({ status: false, message: "Password should be in 8-15 character" }) }


        const user = await userModel.findOne({ email: email })
        if (!user) return res.status(400).send({ status: false, message: "enter correct email" })
        let checkPassword = user.password
        let matchUser = await bcrypt.compare(password, checkPassword)
        if (!matchUser) return res.status(400).send({ status: false, message: "password does not match" })


        let token = jwt.sign({

            userId: user._id.toString(),

            at: Math.floor(Date.now() / 1000),                //issued date
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60  //expires in 24 hr 24 represent this

        },
            "project_5"
        );

        res.setHeader("Auth", token);
        res.status(200).send({ status: true, message: 'User login successfull', data: { userId: user._id, token: token } });
    }

    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



const getProfile = async function (req, res) {
    try {
        const userId = req.params.userId

        if(!userId) return res.status(400).send({ status: false, msg: "Please provide userId in params" })

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId in params" })
        }

        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(404).send({ status: false, msg: "User doesn't exists by userId" })
        }

        return res.status(200).send({ status: true, msg: "Profile found successfully.", data: findUserProfile })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//***************[UPDATE USER PROFILE]**************//

const updateUser = async function (req, res) {
    try {
        const data = req.body
        let userId = req.params.userId
        let files = req.files

        let { fname, lname, email, phone, password, address } = data

        let update = {}

        if (!(Object.keys(data).length || files)) return res.status(400).send({ status: false, msg: "Please provide some data for update" })

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not valid" })
        }

        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) return res.status(400).send({ status: false, msg: "User doesn't exists by this userId" })


        if (fname) {
            if (!validators.isValid(fname)) return res.status(400).send({ status: false, message: "Please include correct fname" });
            if ((fname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from fname" }); }
            update.fname = fname
        }

        if (lname) {
            if (!validators.isValid(lname)) return res.status(400).send({ status: false, message: "Please include correct lname" });
            if ((lname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from lname" }); }
            update.lname = lname
        }
        if (email) {
            if (typeof (email) != "string") return res.status(400).send({ status: false, message: "Please use correct EmailId" })
            if (!validators.isValidEmail(email)) return res.status(400).send({ status: false, message: "Email is invalid." })
            if ((email).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in email" }); }
            const OldEmail = await userModel.findOne({ email })
            if (OldEmail) return res.status(400).send({ status: false, message: "email already exists" })
            update.email = email

        }

        if (phone) {
            if (!validators.isValidMobile(phone)) return res.status(400).send({ status: false, message: "Phone number is invalid." })
            if (typeof (phone) != "string") { return res.status(400).send({ status: false, message: "provide phone no. in string." }); }
            if ((phone).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from phone number" }); }
            const uniqueMobile = await userModel.findOne({ phone })
            if (uniqueMobile) return res.status(400).send({ status: false, message: "Phone number already exists." })
            update.phone = phone
        }

        if (password) {
            if (typeof (password) != "string") { return res.status(400).send({ status: false, message: "Provide password  in String" }); }
            if ((password).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in password" }); }
            if (!((password.length >= 8) && (password.length < 15))) { return res.status(400).send({ status: false, message: "Password should be in 8-15 character" }) }
            let protectedPassword = await bcrypt.hash(password, 10)
            password = protectedPassword
            update.password = password
        }
        if (files && files.length > 0) {
            if (!/(\.jpg|\.jpeg|\.bmp|\.gif|\.png)$/i.test(data.profileImage)) return res.status(400).send({ status: false, message: "Please provide profileImage in correct format like jpeg,png,jpg,gif etc" })
            let uploadedFileURL = await aws.uploadFile(files[0])
            update.profileImage = uploadedFileURL
        }



        if (address) {
            try {
                if (typeof address === "string") { address = JSON.parse(address) }
            } catch (error) {
                return res.status(400).send({status:false,message:"Please enter Pincode in correct format"})
            }
            
            if (!Object.keys(address).length) return res.status(400).send({ status: false, message: "Address can't be empty" });
            if (address.shipping) {
                if (!Object.keys(address.shipping).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Shipping address" }); }

                if (address.shipping.street) {
                    if ((typeof (address.shipping.street) !== "string")|| (address.shipping.street=="")) return res.status(400).send({ status: false, message: "Provide street name in string formatn or enter some data" })
                    if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.shipping.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });
                    update["address.shipping.street"] = address.shipping.street
                }

                if (address.shipping.city) {
                    if (!validators.isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "Please enter Valid Shipping city address" })
                    update["address.shipping.city"] = address.shipping.city
                }

                if (address.shipping.pincode) {
                    if (!(/^[1-9][0-9]{5}$/.test(address.shipping.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                    update["address.shipping.pincode"] = address.shipping.pincode
                }
            }
            if (address.billing) {
                if (!Object.keys(address.billing).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Billing address" }); }

                if (address.billing.street) {
                    if ((typeof (address.billing.street) !== "string")|| address.billing.street=="") return res.status(400).send({ status: false, message: "Provide street name in string format or Enter some data" })
                    if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.billing.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });
                    update["address.billing.street"] = address.billing.street
                }

                if (address.billing.city) {
                    if (!validators.isValid(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter Valid billing city address" })
                    update["address.billing.city"] = address.billing.city
                }

                if (address.billing.pincode) {
                    if (!(/^[1-9][0-9]{5}$/.test(address.billing.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                    update["address.billing.pincode"] = address.billing.pincode
                }
            }

        }

        let updatedUserProfile = await userModel.findByIdAndUpdate({ _id: userId }, update, { new: true })
        return res.status(200).send({ status: true, message: "User profile updated", data: updatedUserProfile })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: "Error", error: err.message })
    }
}

module.exports = { createUser, loginUser, getProfile, updateUser }
