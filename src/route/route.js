const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController= require('../controllers/productController')
const cartController=require("../controllers/cartController")
const orderController=require("../controllers/orderController")
const {authentication,authorisation } = require("../middleWare/auth")

//==========================userController======================================
router.post("/register",userController.createUser)
router.post("/login",userController.createLogin)
router.get("/user/:userId/profile",authentication,authorisation,userController.getprofile)
router.put("/user/:userId/profile",authentication,authorisation,userController.updateUser)
//====================productController===========================================
router.post("/products",productController.createProduct)
router.get("/products",productController.getallProducts)
router.get("/products/:productId",productController.getproductbyId)
router.put("/products/:productId",productController.updatedProduct)
router.delete("/products/:productId",productController.deleteprodbyId)
//====================cartController========================================
router.post("/users/:userId/cart",authentication,authorisation,cartController.createCart)
router.put("/users/:userId/cart",authentication,authorisation,cartController.updateCart)
router.get("/users/:userId/cart",authentication,authorisation,cartController.getCart)
router.delete("/users/:userId/cart",authentication,authorisation,cartController.deleteCart)
//======================orderController=======================================
router.post("/users/:userId/orders",authentication,authorisation,orderController.createOrder)
router.put("/users/:userId/orders",authentication,authorisation,orderController.updateOrder)
router.all("/**", function (req, res) {
    res.status(400).send({
        status: false,
        msg: "The api you request is not available"
    })
})
module.exports=router