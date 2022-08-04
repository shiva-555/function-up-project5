const cartModel = require("../models/cartModel")
const userModel=require("../models/userModel")
const productModel=require("../models/productModel")
const mongoose=require("mongoose")
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    // if (typeof value === "number" && value.toString().trim().length === 0) return false
    return true;
};
const isvalidRequest = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidObjectId = function (id) {
    var ObjectId = mongoose.Types.ObjectId;
    return ObjectId.isValid(id)
}

// const createCart = async function (req, res) {
//     try {
//         let userId = req.params.userId
//         let productId = req.body.productId


//         let productDetails = { productId, quantity: 1 }

//         // ----------------VALIDATING productId and then CHECKING product in DB----------------  
    
//         if (!isValid(productId)) return res.status(400).send({ status: false, message: "productId is required" })
//         if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "invalid product Id.." })
//         const product = await productModel.findOne({ _id: productId, isDeleted: false })
//         if (!product) return res.status(400).send({ status: false, message: "product not found or may be deleted..." })

//         const productPrice = product.price

//         // -------------CHECKING cart is already present for  user or not------------
//         const isCartExist = await cartModel.findOne({ userId: userId })

//         if (isCartExist) {
//             let alreadyProductsId = isCartExist.items.map(x => x.productId.toString())
//             if (alreadyProductsId.includes(productId)) {
//                 let updatedCart = await cartModel.findOneAndUpdate({ "items.productId": productId, userId: userId }, { $inc: { "items.$.quantity": 1, totalPrice: productPrice } }, { new: true })
//                 return res.status(200).send({ status: true, message: "items added successfully", data: updatedCart })
//             }
//             else {
//                 let updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { $push: { items: productDetails }, $inc: { totalItems: 1, totalPrice: productPrice } }, { new: true })
//                 return res.status(200).send({ status: true, message: "items added successfully", data: updatedCart })
//             }
//         }

//         // -----------If cart is not present then creating new CART for user----------
//         const cartDetails = {
//             userId: userId,
//             items: [productDetails],
//             totalItems: 1,
//             totalPrice: productPrice
//         }
//         const cartData = await cartModel.create(cartDetails)
//         return res.status(201).send({ status: true, message: "cart created successfully", data: cartData })
//     }
//     catch (err) {
//         return res.status(500).send({ status: false, error: err.message })
//     }
// }

 const createCart = async function (req, res) {

    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        let { quantity, productId, cartId } = requestBody;

 //-----------Request Body Validation---------//

        if (!isvalidRequest(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" });
        }

        // if(!userId) return res.status(400).send({msg:"userId is required"})
        // if (!isValidObjectId(userId)) {
        //     return res.status(400).send({ status: false, message: "Please provide valid User Id" });
        // }



        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
        }

        if (!quantity) {
            quantity = 1;

        } else {
            if (!isValid(quantity)) {
                return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." });
            }
        }
//---------Find User by Id--------------//

        const findUser = await userModel.findById({ _id: userId });

        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!findProduct) {
            return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
        }
//----------Find Cart By Id----------//

        if (cartId) {
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Please provide valid cartId" });
            }

            var cartIsUnique = await cartModel.findOne({ _id: cartId, isDeleted: false })

            if (!cartIsUnique) {
                return res.status(400).send({ status: false, message: "cartId doesn't exits" })
            }
        }

        const findCartOfUser = await cartModel.findOne({ userId: userId, isDeleted: false });

//------------Create New Cart------------//

        if (!findCartOfUser) {

            var cartData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quantity,
                    },
                ],
                totalPrice: findProduct.price * quantity,
                totalItems: 1,
            };

            const createCart = await cartModel.create(cartData);
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
        }
//--------Check Poduct Id Present In Cart-----------//

        if (findCartOfUser) {

            let price = findCartOfUser.totalPrice + quantity * findProduct.price;

            let arr = findCartOfUser.items;

            for (i in arr) {
                if (arr[i].productId.toString() === productId) {
                    arr[i].quantity += quantity;
                    let updatedCart = {
                        items: arr,
                        totalPrice: price,
                        totalItems: arr.length,
                    };
//-------------Update Cart---------------------//

                    let responseData = await cartModel.findOneAndUpdate(
                        { _id: findCartOfUser._id },
                        updatedCart,
                        { new: true }
                    );
                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });



                }
            }
 //---------Add Item & Update Cart----------//

            arr.push({ productId: productId, quantity: quantity });

            let updatedCart = {
                items: arr,
                totalPrice: price,
                totalItems: arr.length,
            };

            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
            return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
        }

    } catch (error) {
        res.status(500).send({ status: false, data: error.message });
    }
};
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
        console.log(isCartExist)
        if (!isCartExist) return res.status(404).send({ status: false, message: "cart does not exist.." })
        if (isCartExist.items.length == 0) return res.status(404).send({ status: false, message: "No Product Present In the Cart" })

         const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, message: "product details not found or may be deleted" })

        // -------------CHECKING cartData with particular productId------------
        const cartData = await cartModel.findOne({ "items.productId": productId, _id: cartId })
        if (!cartData) return res.status(404).send({ status: false, message: "This Product not present in the following Cart" })

        // -------------ASSIGNING price and quantity fot the product-----------
        const price = findProduct.price
        const quantity = cartData.items.filter(x => x.productId.toString() === productId)[0].quantity 

        console.log(quantity,price,"q")

        if (removeProduct != 0 && removeProduct != 1) return res.status(400).send({ status: false, message: "remove Product should contain 0 and 1 only.." })

        if (removeProduct == 0) {
            const deleteProduct = await cartModel.findOneAndUpdate({ "items.productId": productId, _id: cartId },
                { $pull: { items: { productId: productId } }, $inc: { totalItems: -1, totalPrice: -price * quantity } }, { new: true })
            return res.status(200).send({ status: true, messsage: "item removed successfully", data: deleteProduct })
        }
        if (removeProduct == 1) {
            if (quantity > 1) {
                let reduceProduct = await cartModel.findOneAndUpdate({  _id: cartId ,"items.productId": productId},  
                    { $inc: { "items.$.quantity": -1, totalPrice: -price } }, { new: true })
                    // console.log(productId,cartId)
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
const getCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })


        let validUser = await userModel.findOne({ _id: userId })
        if (req.userId != userId) return res.status(401).send({ status: false, msg: "unauthorised user login" })

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
        if(!userId) return res.send({msg:"userid is required"})

        let Cart = await cartModel.findOne({ _id: userId });
        //if (req.userId != userId) return res.status(401).send({ status: false, msg: "unauthorised user login" })

        if (!Cart) return res.status(404).send({ status: false, message: `No cart found with this  userId` });

        if (Cart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

        let deltcart = await cartModel.findByIdAndUpdate(
            { _id: Cart._id },
            { items: [], totalPrice: 0, totalItems: 0 },
            { new: true }
        )

       return res.status(204).send({ status: true, message: "Products removed successfully", data:deltcart })
    } catch (err) {
       return res.status(500).send({ status: false, error: err.message })
    }
}

module.exports.createCart = createCart
module.exports.getCart = getCart
module.exports.updateCart=updateCart
module.exports.deleteCart = deleteCart


