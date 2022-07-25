const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    fname: {Type:string, 
    required:true},
    lname: {Type:string, 
        required:true},
    email: {Type:string, required:true, unique:true},
    profileImage: {Type:string, unique:true}, // s3 link
    phone: {type:string, required:true, unique:true}, 
    password: {Type:string,required:true }, // encrypted password
    address:   {
        shipping: {
          street: {Type:string, required:true},
          city: {Type:string, required:true},
          pincode: {Type:Number, required:true}
        },
        billing: {
            street: {Type:string, required:true},
            city: {Type:string, required:true},
            pincode: {Type:Number, required:true}
    }
}}
, { timestamps: true });

module.exports = mongoose.model('User', userSchema)