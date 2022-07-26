const  express  = require("express");
const userController = require("../controllers/userController");
const middleWare = require("../middleware/auth")
const router = express.Router();


router.post("/register",userController.createUser)

router.post("/login",userController.loginUser)

router.get("/user/:userId/profile",middleWare.authenticate,userController.getProfile)

router.put("/user/:userId/profile",middleWare.authenticate,middleWare.authorize,userController.updateUser)


module.exports = router