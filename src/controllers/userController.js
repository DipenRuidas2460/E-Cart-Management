const userModel = require("../models/userModel")
const validators = require("../validators/validator")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const aws = require('../aws/aws');
const bcrypt = require('bcrypt');

//**************************************************1.CREATE USER************************************************************* */

const createUser = async function (req, res) {
    try {
        let data = req.body;
        //______________________________ empty body validation _______________________________________//

        if (!Object.keys(data).length) { return res.status(400).send({ status: false, message: "Data can't be empty" }) }

        //_____________________________ parsing of form data ________________________________________//
        try {
            if (typeof data === "string") { data = JSON.parse(data) }
        } catch (error) {
            return res.status(400).send({ status: false, message: "Please enter Pincode in correct format" })
        }

        //______________________________ FILES VALIDATION ____________________________________________//

        let files = req.files

        if (!files || files.length === 0) return res.status(400).send({ status: false, message: "Profile image is mandatory" })

        let uploadedFileURL = await aws.uploadFile(files[0])  // Uploading file to aws

        data.profileImage = uploadedFileURL                   

        if (!/(\.jpg|\.jpeg|\.bmp|\.gif|\.png|\.jfif)$/i.test(data.profileImage)) return res.status(400).send({ status: false, message: "Please provide profileImage in correct format like jpeg,png,jpg,gif,bmp etc" })

       //____________________________________________________________________________________________________//

        let { fname, lname, email, phone, password, address } = data    // destructuring data

        //___________________________________ fname Validation_______________________________________________//

        if (!(fname)) { return res.status(400).send({ status: false, message: "first name is required." }); }
        if (!validators.isValid(fname)) return res.status(400).send({ status: false, message: "Please enter valid first name" });
        if (!validators.IsValidStr(fname)) return res.status(400).send({ status: false, message: "use alphabets only in first name" });
        if ((fname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from first name" }); }

        //_____________________________________ lname Validation____________________________________________//

        if (!(lname)) { return res.status(400).send({ status: false, message: "last name is required." }); }
        if (!validators.isValid(lname)) return res.status(400).send({ status: false, message: "Please enter valid last name" });
        if (!validators.IsValidStr(lname)) return res.status(400).send({ status: false, message: "use alphabets only in last name" });
        if ((lname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from last name" }); }

        //_______________________________________ email Validation___________________________________________//

        if (!email) { return res.status(400).send({ status: false, message: "Please enter email" }) };
        if (!validators.isValid(email)) return res.status(400).send({ status: false, message: "Please enter valid EmailId" })
        if (!validators.isValidEmail(email)) return res.status(400).send({ status: false, message: "Email is invalid." })
        if ((email).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from emailId" }); }
        const OldEmail = await userModel.findOne({ email })
        if (OldEmail) return res.status(409).send({ status: false, message: "email already exists" })

        // _______________________________________phone Validation_____________________________________________//

        if (!phone) return res.status(400).send({ status: false, message: "enter phone number" })
        if (!validators.isValidMobile(phone)) return res.status(400).send({ status: false, message: "Phone number is invalid." })
        if (!validators.isValid(phone)) { return res.status(400).send({ status: false, message: "provide phone no. in string." }); }
        if ((phone).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from phone number" }); }
        const uniqueMobile = await userModel.findOne({ phone })
        if (uniqueMobile) return res.status(409).send({ status: false, message: "Phone number already in use" })

        // _______________________________________password Validation_________________________________________//

        if (!password) { return res.status(400).send({ status: false, message: "Please enter password" }) };
        if (!validators.isValid(password)) { return res.status(400).send({ status: false, message: "Provide password  in String" }); }
        if ((password).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in password" }); }
        if (!((password.length >= 8) && (password.length < 15))) { return res.status(400).send({ status: false, message: "Password should be in 8-15 character" }) }

        //______________________________________________ password encryption _______________________________//
       
        let protectedPassword = await bcrypt.hash(password, 10)
        data.password = protectedPassword

        // _____________________________________________Address Validation_________________________________//


        if (!address) return res.status(400).send({ status: false, message: "Address can't be empty" })
   
        //__ ----------parsing of address-------------------//

        try {
            if (typeof address === "string") { address = JSON.parse(address) }
        } catch (error) {
            return res.status(400).send({ status: false, message: "Please enter Pincode in correct format" })
        }

        //------------empty adress validation----------------//

        if (!Object.keys(address).length) { return res.status(400).send({ status: false, message: "Please provide some data in address" }); }

        if (!address.shipping) return res.status(400).send({ status: false, message: "Shipping Address can't be empty" })
        if (!Object.keys(address.shipping).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Shipping address" }); }

        //--------------shipping address validation------------//

        else {
            // ((----------shipping-street validation-----------))

            if (!(address.shipping.street)) return res.status(400).send({ status: false, message: "shipping street can't be empty" })

            if (!validators.isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Provide street name in string format or enter some data" })

            if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.shipping.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

        //    ((----------shipping-city vlidation----------------))

            if (!(address.shipping.city)) return res.status(400).send({ status: false, message: "shipping-city can't be empty" })

            if (!validators.IsValidStr(address.shipping.city)) return res.status(400).send({ status: false, message: "invalid city name" });

            if (!validators.isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "invalid city" });

         //    ((---------shipping-pincode validation------------))

            if (!(address.shipping.pincode)) return res.status(400).send({ status: false, message: "shipping-pincode can't be empty" })

            else {
                let pinCode = parseInt(address.shipping.pincode)
                if (!(/^[1-9][0-9]{5}$/.test(pinCode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })

            }
        }
         //---------------billing address validations -----------------------//

        if (!address.billing) return res.status(400).send({ status: false, message: "Billing Address can't be empty" })
        if (!Object.keys(address.billing).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Billing address" }); }

        else {
       //  ((-------billing-street validation--------------))

            if (!address.billing.street) return res.status(400).send({ status: false, message: "street can't be empty" })
            if (!validators.isValid(address.billing.street)) return res.status(400).send({ status: false, message: "Provide street name in string format or enter some data" })
            if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.billing.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });

     // ((---------billing-city-validation------------------))

            if (!address.billing.city) return res.status(400).send({ status: false, message: "city can't be empty" })
            if (!validators.IsValidStr(address.billing.city)) return res.status(400).send({ status: false, message: "city is only alphabetical" });
            if (!validators.isValid(address.billing.city)) return res.status(400).send({ status: false, message: "city address is not valid address" });
    //  ((--------billing-pincode-validation----------------))

            if (!address.billing.pincode) return res.status(400).send({ status: false, message: "pincode can't be empty" })
            else {
                let pinCode = parseInt(address.billing.pincode)
                if (!(/^[1-9][0-9]{5}$/.test(pinCode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })

            }
        }
//_________________________________________VALIDATIONS COMPLETED________________________________________________________

        data.address = address  //adding adress to data

        let savedData = await userModel.create(data);
        res.status(201).send({ status: true, message: 'User created successfully', data: savedData })


    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}//____+++++++++++++++++++------------------++++++++++++++++++++----------------------++++++++++++++++++++++_----------------------//






//*************************************LOGIN USER************************************************************************************** */
const loginUser = async function (req, res) {
    try {

        let data = req.body  
        //---------------empty body --------------------------//

        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "Please enter details" })

        const { email, password } = data      //  fetching email and password

        //-----------------emailId validation------------------//

        if (!email) return res.status(400).send({ status: false, message: "Please enter email" })

        if (!validators.isValid(email)) return res.status(400).send({ status: false, message: "Please enter valid  EmailId" })

        if (!validators.isValidEmail(email)) return res.status(400).send({ status: false, message: "Provide valid email" })

       //-----------------password validation-----------------//

        if (!password) return res.status(400).send({ status: false, message: "Please enter password" })

        if (!validators.isValid(password)) { return res.status(400).send({ status: false, message: "Provide password  in String" }); }

        if ((password).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in password" }); }

        if (!((password.length >= 8) && (password.length < 15))) { return res.status(400).send({ status: false, message: "Password should be in 8-15 character" }) }

       //------------------matching email and password ------------------//

        const user = await userModel.findOne({ email: email })

        if (!user) return res.status(404).send({ status: false, message: "enter correct email" })

        let checkPassword = user.password

        let matchUser = await bcrypt.compare(password, checkPassword)

        if (!matchUser) return res.status(401).send({ status: false, message: "password does not match" })

      //----------------generating token --------------------------------//

        let token = jwt.sign({

            userId: user._id.toString(),

            at: Math.floor(Date.now() / 1000),                //issued date
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60  //expires in 24 hr 24 represent this

        },
            "project_5"
        );

        res.setHeader("Auth", token);
        return res.status(200).send({ status: true, message: 'User login successfull', data: { userId: user._id, token: token } });
    }

    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}
//_____________++++++++++++++-------------+++++++++++++++----------++++++++++++++++++-----------------++++++++++++++++++++++//





//******************************************** GET USER PROFILE *************************************************************** */

const getProfile = async function (req, res) {
    try {

        const userId = req.params.userId

        //------------[user id validation ]--------------//

        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId in params" })

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params" })
        }

        const findUserProfile = await userModel.findOne({ _id: userId })  // ===== searching user ======//

        if (!findUserProfile) {
            return res.status(404).send({ status: false, message: "User doesn't exists by userId" })  // === user not found === //
        }

        return res.status(200).send({ status: true, message: "Profile found successfully.", data: findUserProfile })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}
//+++++++++++++++++++-----------------------++++++++++++++++++++---------------------+++++++++++++++----------------------------++++++++




//***********************************************[UPDATE USER PROFILE]*****************************************//

const updateUser = async function (req, res) {
    try {

        //---------^^^^^^^^^^^^ fetching request data    ^^^^^^^^^^^^ ----------//

        let data = req.body
        let userId = req.params.userId
        let files = req.files

        //---------------------empty body validation -----------------------//

        if (!(Object.keys(data).length || files)) return res.status(400).send({ status: false, message: "Please provide some data for update" })

        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId in params" })


        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is not valid" })   // userId validation 
        }
        //--------------------parsing data -----------------------------//
        try {
            if (typeof data === "string") { data = JSON.parse(data) }
        } catch (error) {
            return res.status(400).send({ status: false, message: "Please enter Pincode in correct format" })
        }


        let { fname, lname, email, phone, password, address } = data      // destructuring data 

        let update = {}                // empty object , will be used for update


           // ----------------userId --------------//

        const findUserProfile = await userModel.findOne({ _id: userId })      
        if (!findUserProfile) return res.status(404).send({ status: false, message: "User doesn't exists by this userId" })

          //---------------fname  valod
        if (fname) {
            if (!validators.isValid(fname)) return res.status(400).send({ status: false, message: "Please include correct fname" });
            if (!validators.IsValidStr(fname)) return res.status(400).send({ status: false, message: "fname is only alphabetical" });
            if ((fname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from fname" }); }
            update.fname = fname
        }

        if (lname) {
            if (!validators.isValid(lname)) return res.status(400).send({ status: false, message: "Please include correct lname" });
            if (!validators.IsValidStr(lname)) return res.status(400).send({ status: false, message: "lname is only alphabetical" });
            if ((lname).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from lname" }); }
            update.lname = lname
        }
        if (email) {
            if (!validators.isValid(email)) return res.status(400).send({ status: false, message: "Please use correct EmailId" })
            if (!validators.isValidEmail(email)) return res.status(400).send({ status: false, message: "Email is invalid." })
            if ((email).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in email" }); }
            const OldEmail = await userModel.findOne({ email })
            if (OldEmail) return res.status(409).send({ status: false, message: "email already exists" })
            update.email = email

        }

        if (phone) {
            if (!validators.isValidMobile(phone)) return res.status(400).send({ status: false, message: "Phone number is invalid." })
            if (!validators.isValid(phone)) { return res.status(400).send({ status: false, message: "provide phone no. in string." }); }
            if ((phone).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces from phone number" }); }
            const uniqueMobile = await userModel.findOne({ phone })
            if (uniqueMobile) return res.status(409).send({ status: false, message: "Phone number already exists." })
            update.phone = phone
        }

        if (password) {
            if (!validators.isValid(password)) { return res.status(400).send({ status: false, message: "Provide password  in String" }); }
            if ((password).includes(" ")) { return res.status(400).send({ status: false, message: "Please remove any empty spaces in password" }); }
            if (!((password.length >= 8) && (password.length < 15))) { return res.status(400).send({ status: false, message: "Password should be in 8-15 character" }) }
            let protectedPassword = await bcrypt.hash(password, 10)
            password = protectedPassword
            update.password = password
        }
        if (files && files.length > 0) {
            if (!files || files.length === 0) return res.status(400).send({ status: false, message: "Please add some file" })
            let uploadedFileURL = await aws.uploadFile(files[0])
            update.profileImage = uploadedFileURL
            if (!/(\.jpg|\.jpeg|\.bmp|\.gif|\.png|\.jfif)$/i.test(update.profileImage)) return res.status(400).send({ status: false, message: "Please provide profileImage in correct format like jpeg,png,jpg,gif,bmp etc" })        
        }


        if (address) {
            try {
                if (typeof address === "string") { address = JSON.parse(address) }
            } catch (error) {
                return res.status(400).send({ status: false, message: "Please enter Pincode in correct format" })
            }

            if (address=="") return res.status(400).send({ status: false, message: "Address can't be empty" })

            if (!Object.keys(address).length) return res.status(400).send({ status: false, message: "Address is required and add somedata in address" });
            if (address.shipping) {
                if (!Object.keys(address.shipping).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Shipping address" }); }

                if (address.shipping.street) {
                    if (!validators.isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Provide street name in string formatn or enter some data" })
                    if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.shipping.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });
                    update["address.shipping.street"] = address.shipping.street
                }

                if (address.shipping.city) {
                    if (!validators.isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "Please enter Valid Shipping city address" })
                    if (!validators.IsValidStr(address.shipping.city)) return res.status(400).send({ status: false, message: "city is only alphabetical" });
                    update["address.shipping.city"] = address.shipping.city
                }

                if (address.shipping.pincode) {
                    let pinCode = parseInt(address.shipping.pincode)
                    if (!(/^[1-9][0-9]{5}$/.test(pinCode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                    update["address.shipping.pincode"] = pinCode
                }
            }
            if (address.billing) {
                if (!Object.keys(address.billing).length) { return res.status(400).send({ status: false, message: "Please provide somedata in Billing address" }); }

                if (address.billing.street) {
                    if (!validators.isValid(address.billing.street)) return res.status(400).send({ status: false, message: "Provide street name in string format or Enter some data" })
                    if (!/^[#.0-9a-zA-Z\s,-]+$/.test(address.billing.street)) return res.status(400).send({ status: false, message: "Street address is not valid address" });
                    update["address.billing.street"] = address.billing.street
                }

                if (address.billing.city) {
                    if (!validators.isValid(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter Valid billing city address" })
                    if (!validators.IsValidStr(address.billing.city)) return res.status(400).send({ status: false, message: "city is only alphabetical" });
                    update["address.billing.city"] = address.billing.city
                }

                if (address.billing.pincode) {
                    let pinCode = parseInt(address.billing.pincode)
                    if (!(/^[1-9][0-9]{5}$/.test(pinCode))) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                    update["address.billing.pincode"] = pinCode
                }
            }

        }

        let updatedUserProfile = await userModel.findOneAndUpdate({ _id: userId }, update, { new: true })
        return res.status(200).send({ status: true, message: "User profile updated", data: updatedUserProfile })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message })
    }
}

module.exports = { createUser, loginUser, getProfile, updateUser }
