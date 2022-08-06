let cartModel = require("../models/cartModel")
let orderModel = require("../models/orderModel")
let userModel = require("../models/userModel")
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

//=====================================createorder===============================================
const createOrder = async function (req, res) {

    const userId = req.params.userId;
    const requestBody = req.body;

    if (!isvalidRequest(requestBody)) {
        return res.status(400).send({ status: false, message: "Invalid request body. Please provide the the input to proceed", });
    };
    //Extract Params
    const { cartId, cancellable, status } = requestBody;

    if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: "Invalid userId in params." });
    };
    // find User
    const findUser = await userModel.findOne({ _id: userId });
    if (!findUser) {
        return res.status(400).send({ status: false, message: "user doesn't exists for uderId" });
    };

    if (!cartId) {
        return res.status(400).send({ status: false, message: "CartId is required field}" });
    };

    if (!isValidObjectId(cartId)) {
        return res.status(400).send({ status: false, message: "Invalid cartId in request body" });
    };

    const findCartDetails = await cartModel.findOne({ _id: cartId, userId: userId, });

    if (!findCartDetails) {
        return res.status(400).send({ status: false, message: `Cart doesn't belongs to ${userId}` });
    };

    if (cancellable) {
        if (!isValid(cancellable)) {
            return res
                .status(400)
                .send({ status: false, message: "<cancellable>. can't be Empty." });
        }
        //  && -> ||  ??
        if (cancellable !== "true" && cancellable !== "false") {
            return res.status(400).send({
                status: false,
                message: "<cancellable> must be either <true> or <false>.",
            });
        }
    }

    //checking if status is present in request body
    if (status) {
        if (!isValid(status)) return res.status(400).send({ status: false, message: "Enter a valid value for is order status" });

        //validating if status is in valid format
        if (!(['Pending', 'Completed', 'Cancelled'].includes(status))) return res.status(400).send({ status: false, message: "Order status should be one of this 'Pending','Completed' and 'Cancelled'" });
    }

    //verifying whether the cart is having any products or not
    
    if (findCartDetails.items.length == 0)
        return res
            .status(400) // 404 ?????????
            .send({
                status: false,
                message: "Cart Empty: Add product(s) to Cart to create order.",
            });

    let totalQuantity = 0;
    for (let i in findCartDetails.items) {
        totalQuantity += findCartDetails.items[i].quantity;
    };

    //object destructuring for response body
    const orderDetails = {
        userId: userId,
        items: findCartDetails.items,
        totalPrice: findCartDetails.totalPrice,
        totalItems: findCartDetails.totalItems,
        totalQuantity: totalQuantity,
        cancellable,
        status,
    };


    const savedOrder = await orderModel.create(orderDetails);
    // Empty cart after creating Order.
    await cartModel.updateOne(
        { _id: findCartDetails._id },
        { items: [], totalPrice: 0, totalItems: 0 }
    )

    return res.status(200).send({ status: true, message: "Sucessfully Order placed", data: savedOrder });
}

//=====================================update order===============================================

const updateOrder = async (req, res) => {
    //- Make sure that only a cancellable order could be canceled. Else send an appropriate error message and response.
    try {
      console.log("Update Order");
  
      const userIdParams = req.params.userId.trim();
      if (!isValidObjectId(userIdParams)) {
        return res.status(400).send({
          status: false,
          message: `userId in Params: <${userIdParams}> NOT a Valid Mongoose Object ID.`,
        });
      }
  
      if (!isvalidRequest(req.body)) {
        return res
          .status(400)
          .send({ status: false, message: "Request Body Empty." });
      }
  
      //- Get order id in request body.
      // const { orderId } = req.body;
      const { orderId, status } = req.body;
  
      // if (cancellable) {}
      if (!isValid(orderId)) {
        return res.status(400).send({ status: false, message: "<orderId> required." });
      }
      if (!isValidObjectId(orderId)) {
        return res.status(400).send({status: false,message: `orderId: <${orderId}> NOT a Valid Mongoose Object ID.`,
        });
      }
  
      if (!isValid(status)) {
        return res.status(400).send({ status: false, message: "<status> required." });
      }
      if (status != "cancelled" && status != "completed") {
        return res.status(400).send({status: false,message: "<status> can either be <cancelled> or <completed> only.",
        });
      }
  
      //- Make sure the user exist.
      const findUser = await userModel.findById(userIdParams);
      if (!findUser) {
        return res.status(404).send({status: false,message: `USER with ID: <${userIdParams}> NOT Found in Database.`,
        });
      }
  
      //- Make sure the order belongs to the user.
      const findOrder = await orderModel.findOne({
        _id: orderId,
        userId: userIdParams,
      });
      if (!findOrder) {
        return res.status(404).send({
          status: false,
          message: `userId: <${userIdParams}> has not created any Order with orderId : <${orderId}> (Order Not found in Database).`,
        });
      }
  
      //- Make sure that only a cancellable order could be canceled. Else send an appropriate error message and response.
      if (findOrder.cancellable === "false" || findOrder.cancellable === false) {
        if (status == "cancelled") {
          return res.status(400).send({
            status: false,
            message: `Can't cancel Order as <cancellable>: 'false'.`,
          });
        }
      }
      if (findOrder.status == "cancelled") {
        return res.status(400).send({
          status: false,
          message: `Order already cancelled (as <status>: 'cancelled').`,
        });
      }
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      if (findOrder.status == "completed") {
        return res.status(400).send({
          status: false,
          message: `Order already completed (as <status>: 'completed').`,
        });
      }
  
      // const updatedOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })
      let updatedOrder;
  
      if (status == "cancelled") {
        updatedOrder = await orderModel.findByIdAndUpdate(
          orderId,
          { status: "cancelled" },
          { new: true }
        );
      }
  
      if (status == "completed") {
        updatedOrder = await orderModel.findByIdAndUpdate(
          orderId,
          { status: "completed" },
          { new: true }
        );
      }
  
      //- **On success** - Return HTTP status 200. Also return the updated order document.
      // message: "Order Updated Successfully.",
      return res.status(200).send({
        status: true,
        message: "Success",
        data: updatedOrder,
      });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  
module.exports.createOrder = createOrder
module.exports.updateOrder=updateOrder