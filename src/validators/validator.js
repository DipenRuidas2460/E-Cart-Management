const isValid = function (x) {
    let strRegex = /^[a-zA-Z,\-.\s]*$/
    if (typeof x === 'undefined' || x === null) return false
    if (typeof x != "string" ) return false
    if (typeof x === 'string' && x.trim().length === 0) return false
    if (!strRegex.test(x)) return false
    return true
}


const isValidEmail = function (y) {

    let emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
    if (emailRegex.test(y)) return true
}

const isValidMobile = function (y) {
    let mobileRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/
    if (mobileRegex.test(y)) return true
}


module.exports.isValid = isValid
module.exports.isValidEmail = isValidEmail
module.exports.isValidMobile = isValidMobile

