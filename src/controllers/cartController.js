const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const mongoose = require("mongoose")
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    // if (typeof value === "number" && value.toString().trim().length === 0) return false
    if (typeof value === "string")
        return true;
};
const isvalidRequest = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidObjectId = function (id) {
    var ObjectId = mongoose.Types.ObjectId;
    return ObjectId.isValid(id)
}



const createCart = async (req, res) => {
    try {
        // console.log("Add To Cart");

        const userIdParams = req.params.userId.trim();

        if (!isValidObjectId(userIdParams)) {
            return res.status(400).send({
                status: false,
                message: `userId in Params: <${userIdParams}> NOT a Valid Mongoose Object ID.`,
            });
        }

        //- Make sure the user exist.
        const findUser = await userModel.findById(userIdParams);
        if (!findUser) {
            return res.status(404).send({
                status: false,
                message: `USER with ID: <${userIdParams}> NOT Found in Database.`,
            });
        }

        if (!isvalidRequest(req.body)) {
            return res
                .status(400)
                .send({ status: false, message: "Request Body Empty." });
        }

        //- Get cart id in request body.
        //- Get productId in request body.
        let { cartId, productId } = req.body;

        // Cart ID. -> NOT MAndatory????????????
        let findCart;

        // if (cartId) {
        if (typeof cartId !== "undefined") {
            if (!isValid(cartId)) {
                return res
                    .status(400)
                    .send({ status: false, message: "<cartId> is required." });
            }
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({
                    status: false,
                    message: `cartId: <${cartId}> NOT a Valid Mongoose Object ID.`,
                });
            }
            //- Make sure that cart exist.
            findCart = await cartModel.findOne({
                _id: cartId,
                userId: userIdParams,
            }); // Added userId: userIdParams -> Test again.
            if (!findCart) {
                return res.status(404).send({
                    status: false,
                    message: `CART with ID: <${cartId}> of USER: <${userIdParams}> NOT Found in Database.`,
                });
            }
        }
        // }
        // IF cartId NOT in REquest-Body.   ~~~~~~~~~~~~~~~~~~~!!!!!!!!!!!!!!!!!!!
        else {
            findCart = await cartModel.findOne({ userId: userIdParams });
            if (findCart) {
                cartId = findCart._id;
            }
        }

        // Product ID.
        if (!isValid(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "<productId> is required." });
        }
        if (!isValidObjectId(productId)) {
            // postman- Number -> ERROR!!!!!!!!!
            return res.status(400).send({
                status: false,
                message: `productId: <${productId}> NOT a Valid Mongoose Object ID.`,
            });
        }
        //- Make sure the product(s) are valid and not deleted.!!!!!!!!!!!!!!
        const findProduct = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!findProduct) {
            return res.status(404).send({
                status: false,
                message: `PRODUCT with ID: <${productId}> NOT Found in Database.`,
            });
        }

        //- Add a product(s) for a user in the cart.
        if (findCart) {
            // IF <productId> already in Cart.
            const isProductAlready = findCart.items.filter(
                (x) => x.productId.toString() === productId
            );

            if (isProductAlready.length > 0) {
                // Update Product in Cart.
                const addProduct = await cartModel.findOneAndUpdate(
                    {
                        userId: userIdParams,
                        "items.productId": productId,
                    },
                    {
                        $inc: {
                            "items.$.quantity": 1,
                            totalPrice: findProduct.price,
                        },
                    },
                    { new: true }
                );
                // totalItems: 1, --> in $inc: !!

                return res.status(201).send({
                    status: true,
                    message: "Success",
                    data: addProduct,
                });
            }

            // ELSE. -> Create Product in Cart.
            const createProduct = await cartModel.findOneAndUpdate(
                { _id: cartId },
                {
                    $push: { items: { productId: productId, quantity: 1 } },
                    $inc: { totalItems: 1, totalPrice: findProduct.price },
                },
                { new: true }
            );

            // 201 ???????????!!!!!!!!!!!!!!!!!!!!!!!!!
            return res.status(201).send({
                status: true,
                message: "Success",
                data: createProduct,
            });
        }

        //- Create a cart for the user if it does not exist. Else add product<(s)> in cart.
        const cart = {
            userId: userIdParams,
            items: [{ productId: productId, quantity: 1 }],
            totalItems: 1,
            totalPrice: findProduct.price,
        };
        const createCart = await cartModel.create(cart);

        //- Get product(s) details in response body. !!!!!!!!!!!
        return res.status(201).send({
            status: true,
            message: "Success",
            data: createCart,
        });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

//=========================update cart=================================
const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId

        // ---------------DESTRUCTURING bodyData---------------
        const { cartId, productId, removeProduct } = req.body

        // ------------------------VALIDATION starts from here-------------------------
        if (!isValid(cartId)) return res.status(400).send({ status: false, message: "Provide cartId " })
        if (!isValid(productId)) return res.status(400).send({ status: false, message: "Provide productId " })
        if (!isValid(removeProduct)) return res.status(400).send({ status: false, message: "Provide removeProduct field" })

        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "invalid cart Id.." })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "invalid product Id.." })
        // ---------------------------VALIDATION ends here------------------------------

        // -------------CHECKING cart is already present for user or not------------
        const isCartExist = await cartModel.findOne({ $or: [{ _id: cartId }, { userId: userId }] })
        // console.log(isCartExist)
        if (!isCartExist) return res.status(404).send({ status: false, message: "cart does not exist.." })
        if (isCartExist.items.length == 0) return res.status(404).send({ status: false, message: "No Product Present In the Cart" })

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, message: "product details not found or may be deleted" })

        // -------------CHECKING cartData with particular productId------------
        const cartData = await cartModel.findOne({ "items.productId": productId, _id: cartId })
        if (!cartData) return res.status(404).send({ status: false, message: "This Product not present in the following Cart" })
// console.log(cartData,"sk")
        // -------------ASSIGNING price and quantity fot the product-----------
        const price = findProduct.price
        const quantity = cartData.items.filter(x => x.productId.toString() === productId)[0].quantity

        //console.log(quantity,price,"q")

        if (removeProduct != 0 && removeProduct != 1) return res.status(400).send({ status: false, message: "remove Product should contain 0 and 1 only.." })

        if (removeProduct == 0) {
            const deleteProduct = await cartModel.findOneAndUpdate({ "items.productId": productId, _id: cartId },
                { $pull: { items: { productId: productId } }, $inc: { totalItems: -1, totalPrice: -price * quantity } }, { new: true })
            return res.status(200).send({ status: true, messsage: "item removed successfully", data: deleteProduct })
        }
        // console.log("items.$.quantity","sub")
        if (removeProduct == 1) {
            if (quantity > 1) {
                let reduceProduct = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId },
                    { $inc: { "items.$.quantity": -1, totalPrice: -price } }, { new: true })
                 
                // console.log(reduceProduct)
                return res.status(200).send({ status: true, messsage: "product removed successfully", data: reduceProduct })
            }
            else {
                const deleteProduct = await cartModel.findOneAndUpdate({ "items.productId": productId, _id: cartId },
                    { $pull: { items: { productId: productId } }, $inc: { totalItems: -1, totalPrice: -price } }, { new: true })
                return res.status(200).send({ status: true, messsage: "item removed successfully", data: deleteProduct })
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//===================================getcart======================================================
const getCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })

        let validUser = await userModel.findOne({ _id: userId })
        if (req.userId != userId) return res.status(401).send({ status: false, messege: "unauthorised user login" })

        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })
        // user authorization    
        //if (req.userId != userId) return res.status(401).send({ status: false, messege: "unauthorised user login" })
        let validCart = await cartModel.findOne({ userId: userId }).select({ __v: 0 })
        if (!validCart) return res.status(404).send({ status: false, message: "No cart found" })

        return res.status(200).send({ status: true, message: 'Success', data: validCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}


//=================================delete cart=======================================================
const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId;

        //validating userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        const findUser = await userModel.findOne({ _id: userId })
        if (!findUser) {
            return res.status(400).send({status: false,message: `User doesn't exists by ${userId} `})
        }

        //finding cart
        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            return res.status(400).send({status: false,message: `Cart doesn't exists by ${userId} `})
        }
        //Basically not deleting the cart, just changing their value to 0.
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, {$set: {items: [],totalPrice: 0,totalItems: 0}},{new:true})
        res.status(204).send({status: true,message: "Cart deleted successfully",data:deleteCart })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

module.exports.createCart = createCart
module.exports.getCart = getCart
module.exports.updateCart = updateCart
module.exports.deleteCart = deleteCart


