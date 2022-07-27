const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController= require('../controllers/productController')
const middlewire=require("../middleWare/auth")


router.post("/register",userController.createUser)

router.post("/login",userController.createLogin)
router.get("/user/:userId/profile",userController.getprofile)
router.put("/user/:userId/profile",userController.updateUser)
router.post("/products",productController.createProduct)
module.exports=router