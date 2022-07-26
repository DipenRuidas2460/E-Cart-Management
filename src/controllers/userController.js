const userModel = require("../models/userModel")
const validators = require("../validators/validator")
const jwt = require("jsonwebtoken")
const aws = require('../aws/aws');
const bcrypt = require('bcrypt');

const createUser = async function (req, res) {
    try {
        let userData = req.body;
        if (!validators.isValidBody(userData)) { return res.status(400).send({ status: false, message: "UserData can't be empty" }) }

        let files = req.files

        if (!files || files.length === 0) {
            return res.status(400).send({ status: false, message: "No data found" })
        }
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

        if (!address) return res.status(400).send({ status: false, message: "Address can't be empty" })

        if (!validators.isValidBody(address)) { return res.status(400).send({ status: false, message: "Address can't be empty" }); }


        if (!userData.address.shipping) return res.status(400).send({ status: false, message: "Shipping Address can't be empty" })
        else {
            if (!userData.address.shipping.street) return res.status(400).send({ status: false, message: "street can't be empty" })
            if (typeof (userData.address.billing.street) !== "string") return res.status(400).send({ status: false, message: "Provide street name in string format" })
            if (!/^[#.0-9a-zA-Z\s,-]+$/.test(userData.address.billing.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

            if (!userData.address.shipping.city) return res.status(400).send({ status: false, message: "city can't be empty" })
            if (!validators.isValid(userData.address.shipping.city)) return res.status(400).send({ status: false, message: "city address is not valid address" });


            if (!userData.address.shipping.pincode) return res.status(400).send({ status: false, message: "pincode can't be empty" })
            else {
                if (!(/^[1-9][0-9]{5}$/.test(userData.address.shipping.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                if ((userData.address.shipping.pincode).includes(" ")) return res.status(400).send({ status: false, message: "Please remove any empty spaces from Address pincode" });
            }
        }
       

        if (!userData.address.billing) return res.status(400).send({ status: false, message: "Billing Address can't be empty" })
        else {
            if (!userData.address.billing.street) return res.status(400).send({ status: false, message: "street can't be empty" })
            if (typeof (userData.address.billing.street) !== "string") return res.status(400).send({ status: false, message: "Provide street name in string format" })
            if (!/^[#.0-9a-zA-Z\s,-]+$/.test(userData.address.billing.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

            if (!userData.address.billing.city) return res.status(400).send({ status: false, message: "city can't be empty" })
            if (!validators.isValid(userData.address.billing.city)) return res.status(400).send({ status: false, message: "city address is not valid address" });

            if (!userData.address.billing.pincode) return res.status(400).send({ status: false, message: "pincode can't be empty" })
            else {
                if (!(/^[1-9][0-9]{5}$/.test(userData.address.billing.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                if ((userData.address.billing.pincode).includes(" ")) return res.status(400).send({ status: false, message: "Please remove any empty spaces from Address pincode" });
            }

            
        }

        userData.address = address

        let savedData = await userModel.create(userData);
        res.status(201).send({ status: true, message: 'User created successfully', data: savedData })


    } catch (err) {
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
};

const loginUser = async function (req, res) {
    try {
        let data = req.body
        if (!validators.isValidBody(data)) return res.status(400).send({ status: false, message: "Please enter details" })

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
        res.status(200).send({ status: true, message: 'User login successfull', data: { userId: user._id, token:token } });
    }

    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



const getProfile = async function (req, res) {
    try {
        const userId = req.params.userId
        // const userIdFromToken = req.userId

        if (!validators.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId in params" })
        }

        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(404).send({ status: false, msg: "User doesn't exists by userId" })
        }
        // if (findUserProfile._id.toString() != userIdFromToken) {
        //     return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
        // }

        return res.status(200).send({ status: true, msg: "Profile found successfully.", data: findUserProfile })

    } catch (err) {
        res.status(500).send({ status: false, msg: "Error is: " + err.msg })
    }
}

/***************[UPDATE USER PROFILE]**************/
const updateUser = async function (req, res) {
    try {
        const requestBody = req.body
        let files = req.files
        let userId = req.params.userId
        // let userIdFromToken = req.userId

        if (!validators.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: "Please provide user's details to update" })
        }

        if (!validators.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not valid" })
        }

        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(400).send({ status: false, msg: "User doesn't exists by this userId" })
        }

        let { fname, lname, email, phone, password, address, profileImage } = requestBody;

        if (fname) {
            if (!validators.isValid(fname)) {
                return res.status(400).send({ status: false, msg: "Please Provide fname" })
            }
        }

        if (lname) {
            if (!validators.isValid(lname)) {
                return res.status(400).send({ status: false, msg: "Please Provide lname" })
            }
        }
        if (email) {
            if (!validators.isValid(email)) {
                return res.status(400).send({ status: false, msg: "Please Provide valid email id" })
            }
        }
        let isEmailAlredyPresent = await userModel.findOne({ email: email })
        if (isEmailAlredyPresent) {
            return res.status(400).send({ status: false, msg: "email is already registered" });
        }

        if (phone) {

            return res.status(400).send({ status: false, msg: "Please Provide valid phone" })
        }
        let isPhoneAlredyPresent = await userModel.findOne({ phone: phone })
        if (isPhoneAlredyPresent) {
            return res.status(400).send({ status: false, msg: "Phone number is already registered" });
        }

        if (password) {
            if (!validators.isValid(email)) {
                return res.status(400).send({ status: false, msg: "password is Required" })
            }
        }

        let isPasswordAlredyPresent = await userModel.findOne({ password: password })
        if (isPasswordAlredyPresent) {
            return res.status(400).send({ status: false, msg: "Password number is already registered" });
        }


    } catch (err) {
        return res.status(500).send({ status: false, msg: "Error is: " + err.msg })
    }
}

module.exports = { createUser, loginUser, getProfile, updateUser }
