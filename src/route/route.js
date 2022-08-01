const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController= require('../controllers/productController')
const middlewire=require("../middleWare/auth")


router.post("/register",userController.createUser)

router.post("/login",userController.createLogin)
router.get("/user/:userId/profile",middlewire.authentication,userController.getprofile)
router.put("/user/:userId/profile",middlewire.authentication,userController.updateUser)
router.post("/products",productController.createProduct)
router.get("/products",productController.getallProducts)
router.get("/products/:productId",productController.getproductbyId)
router.put("/products/:productId",productController.updatedProduct)

router.delete("/products/:productId",productController.deleteprodbyId)
module.exports=router