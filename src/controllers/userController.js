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
            res.status(400).send({ status: false, message: "No data found" })
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
        if ((password).includes(" ")) { { return res.status(400).send({ status: false, message: "Please remove any empty spaces in password" }); } }
        if (!((password.length >= 8) && (password.length < 15))) { return res.status(400).send({ status: false, message: "Password should be in 8-15 character" }) }

        let protectedPassword = await bcrypt.hash(password, 10) 
        userData.password = protectedPassword 

        // Address Validation:-

        address = JSON.parse(address)

        if (address) {
            if (!validators.isValidBody(address)) { return res.status(400).send({ status: false, message: "Address can't be empty" }); }
            if (userData.address.shipping) {
                if (!userData.address.shipping.street) return res.status(400).send({ status: false, message: "street can't be empty" })
                if (!validators.isValid(userData.address.shipping.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

                if (!userData.address.shipping.city) return res.status(400).send({ status: false, message: "city can't be empty" })
                if (!validators.isValid(userData.address.shipping.city)) return res.status(400).send({ status: false, message: "city address is not valid address" });


                if (!userData.address.shipping.pincode) return res.status(400).send({ status: false, message: "pincode can't be empty" })
                else {
                    if (!(/^[1-9][0-9]{5}$/.test(userData.address.shipping.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                    if ((userData.address.shipping.pincode).includes(" ")) return res.status(400).send({ status: false, message: "Please remove any empty spaces from Address pincode" });
                }
            }
            if (userData.address.billing) {
                if (!userData.address.billing.street) return res.status(400).send({ status: false, message: "street can't be empty" })
                if (!validators.isValid(userData.address.billing.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

                if (!userData.address.billing.city) return res.status(400).send({ status: false, message: "city can't be empty" })
                if (!validators.isValid(userData.address.billing.city)) return res.status(400).send({ status: false, message: "city address is not valid address" });

                if (!userData.address.billing.pincode) return res.status(400).send({ status: false, message: "pincode can't be empty" })
                else {
                    if (!(/^[1-9][0-9]{5}$/.test(userData.address.billing.pincode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                    if ((userData.address.billing.pincode).includes(" ")) return res.status(400).send({ status: false, message: "Please remove any empty spaces from Address pincode" });
                }
            }
        }

        userData.address = address
        
        let savedData = await userModel.create(userData);
        res.status(201).send({ status: true, message: 'User created successfully', data: savedData })


    } catch (err) {
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
};

module.exports.createUser = createUser