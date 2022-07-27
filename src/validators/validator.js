const isValid = function (x) {
    //let strRegex = /^[a-zA-Z,\-.\s]*$/
    if (typeof x === 'undefined' || x === null) return false
    if (typeof x != "string" ) return false
    if (typeof x === 'string' && x.trim().length === 0) return false
    //if (!strRegex.test(x)) return false
    return true
}

const isValidBody = function (y) {
    return Object.keys(y).length > 0
}

const isValidEmail = function (y) {

    let emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
    if (emailRegex.test(y)) return true
}

const isValidMobile = function (y) {
    let mobileRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/
    if (mobileRegex.test(y)) return true
}
// const isValidPrice=function(y){
//     let priceRegex=/^(\d*([.,](?=\d{3}))?\d+)+((?!\2)[.,]\d\d)?$/
//     if(priceRegex.test(y)) return true
// }


// const isValidString = (String) => {
//     return /\d/.test(String)
// }

const isValidPrice = (price) => {
    return /^[1-9]\d{0,7}(?:\.\d{1,2})?$/.test(price)
}

const  isValidSize=(size) =>{
    let correctSize=["S", "XS", "M", "X", "L", "XXL", "XL"]
    return (correctSize.includes(size))
}

const isValidEnum=function(value){
    let availableSizes=["S", "XS", "M", "X", "L", "XXL", "XL"]
    return availableSizes.includes(value)
}

const isValidNum=(number) => {
    if(/^\d+$/.test(number)){
        return true
    }else{
        return false
    }
}

module.exports={isValidNum,isValidEnum,isValidBody,isValid,isValidEmail,isValidMobile,isValidSize,isValidPrice}


