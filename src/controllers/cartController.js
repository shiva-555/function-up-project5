const cartModel = require("../models/cartModel")
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
const isValidNum = function (value) {
    const num = /^\d{1,5}\.?\d{0,2}$/
    return num.test(value)
}

const createCart = async function (req, res) {
    let userId = req.params.userId
    let data = req.body
    if (!isValidObjectId(userId)) return res.status(400).send({ status: true, msg: "userid is not in correct format" })
    if (!isvalidRequest(data)) return res.status(400).send({ status: false, msg: "requestbody is empty" })
    let { quantity, productId, cartId } = data;
    //------find by userid-----------------------------
    let finduser = await cartModel.find({ _id: userId })
    if (!finduser) return res.status(400).send({ status: false, msg: `user id is already present ${userId}` })

    let product = await cartModel.find({ _id: productId })
    if (!product) return res.status(400).send({ status: false, msg: "product id is not found" })
    //---find by cartid--------------------
    if (cartId) {
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, msg: "cartid is invalid" })
        let cart = await cartModel.findOne({ _id: cartId, isDeleted: false })
        if (!cart) return res.status(400).send({ status: false, msg: "cart is doesnot exsit" })
    }
    
    let findCart = await cartModel.findOne({ _id: cartId, isDeleted: false })
    if (!findCart) {
        var cartData = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity,
            }],
            totalPrice: findProductData.price * quantity,
            totalItems: 1
        }
        const createCart = await cartModel.create(cartData);
        res.status(201).send({ status: true, message: 'Cart created successfully', data: createCart });
    };

}
module.exports.createCart = createCart