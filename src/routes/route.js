const  express  = require("express");
const userController = require("../controllers/userController");
const middleWare = require("../middleware/auth")
const router = express.Router();


router.post("/register",userController.createUser)

// router.post("/login",userController.loginUser)


// router.post("/books", middleWare.authenticate, bookController.createBook)

// router.get("/books", middleWare.authenticate, bookController.getBooks)

// router.get("/books/:bookId",middleWare.authenticate,bookController.getById)

// router.put("/books/:bookId",middleWare.authenticate,middleWare.authorize,bookController.updateById)

// router.delete("/books/:bookId",middleWare.authenticate,middleWare.authorize,bookController.deleteBookById)


// router.post("/books/:bookId/review",reviewController.createReview)

// router.put("/books/:bookId/review/:reviewId",reviewController.updateReview)

// router.delete("/books/:bookId/review/:reviewId",reviewController.deleteReview)


module.exports = router