const cartModel = require("../models/cartModel")
const userModel=require("../models/userModel")
const productModel=require("../models/productModel")
const mongoose=require("mongoose")
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    if (typeof value === "number" && value.toString().trim().length === 0) return false
    return true;
};
const isvalidRequest = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidObjectId = function (id) {
    var ObjectId = mongoose.Types.ObjectId;
    return ObjectId.isValid(id)
}

const createCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let productId = req.body.productId

        let productDetails = { productId, quantity: 1 }

        // ----------------VALIDATING productId and then CHECKING product in DB----------------  
        if (!isValid(productId)) return res.status(400).send({ status: false, message: "productId is required" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "invalid product Id.." })
        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(400).send({ status: false, message: "product not found or may be deleted..." })

        const productPrice = product.price

        // -------------CHECKING cart is already present for  user or not------------
        const isCartExist = await cartModel.findOne({ userId: userId })

        if (isCartExist) {
            let alreadyProductsId = isCartExist.items.map(x => x.productId.toString())
            if (alreadyProductsId.includes(productId)) {
                let updatedCart = await cartModel.findOneAndUpdate({ "items.productId": productId, userId: userId }, { $inc: { "items.$.quantity": 1, totalPrice: productPrice } }, { new: true })
                return res.status(200).send({ status: true, message: "items added successfully", data: updatedCart })
            }
            else {
                let updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { $push: { items: productDetails }, $inc: { totalItems: 1, totalPrice: productPrice } }, { new: true })
                return res.status(200).send({ status: true, message: "items added successfully", data: updatedCart })
            }
        }

        // -----------If cart is not present then creating new CART for user----------
        const cartDetails = {
            userId: userId,
            items: [productDetails],
            totalItems: 1,
            totalPrice: productPrice
        }
        const cartData = await cartModel.create(cartDetails)
        return res.status(201).send({ status: true, message: "cart created successfully", data: cartData })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

const getCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })

        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })
        // user authorization    
        //if (req.userId != userId) return res.status(401).send({ status: false, msg: "unauthorised user login" })
        let validCart = await cartModel.findOne({ userId: userId }).select({ __v: 0 })
        if (!validCart) return res.status(404).send({ status: false, message: "No cart found" })

        return res.status(200).send({ status: true, message: 'Success', data: validCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}



const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId;

        let Cart = await cartModel.findOne({ userId: userId });
        if (!Cart) return res.status(404).send({ status: false, message: `No cart found with this  userId` });

        if (Cart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

        let deltcart = await cartModel.findByIdAndUpdate(
            { _id: Cart._id },
            { items: [], totalPrice: 0, totalItems: 0 },
            { new: true }
        )

        res.status(204).send({ status: true, message: "Products removed successfully", data:deltcart })
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

module.exports.createCart = createCart
module.exports.getCart = getCart
module.exports.deleteCart = deleteCart


