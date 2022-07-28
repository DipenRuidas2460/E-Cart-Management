const  express  = require("express");
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const middleWare = require("../middleware/auth")
const router = express.Router();

/**********************************************[USER API]************************************************/
router.post("/register",userController.createUser)
router.post("/login",userController.loginUser)
router.get("/user/:userId/profile",middleWare.authenticate,middleWare.authorize,userController.getProfile)
router.put("/user/:userId/profile",middleWare.authenticate,middleWare.authorize,userController.updateUser)

/**********************************************[PRODUCT API]************************************************/
router.post("/products",productController.createProduct)

router.get("/products",productController.getProductByQuery)

router.get("/products/:productId",productController.getProductByParams)

router.put("/products/:productId",productController.updateProduct)

router.delete("/products/:productId",productController.deleteProduct)



module.exports = router
