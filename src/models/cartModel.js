const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,ref: ('User'),required: true, unique: true
    },
items: [{
    productId: {type: ObjectId,ref:"Product"},
    quantity: {type:Number, required:true}
  }],
  totalPrice: {type:Number,required:true},
  totalItems: {type:Number,required:true}

})

module.exports=mongoose.model("Cart",cartSchema)