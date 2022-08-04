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
router.get("/user/:userId/profile",userController.getprofile)
router.put("/user/:userId/profile",userController.updateUser)
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
router.post("/users/:userId/orders",orderController.createOrder)
module.exports=router