let productModel = require("../models/productModel")
let { uploadFile } = require("../Aws/aws")
// const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    if (typeof value === "number" && value.toString().trim().length === 0) return false
    return true;
};
const isvalidRequest = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidName = function (value) {
    const dateName = /^[a-zA-Z_ ]{2,100}$/
    return dateName.test(value)
}
// const isValidPrice = function (value) {
//     const price =/^\d{0,8}[.]?\d{1,4}$/
//     return price.test(value)
// }
const isValidNum = function (value) {
    const num = /^\d{1,5}\.?\d{0,2}$/
    return num.test(value)
 }
// title: {type:String, required:true, unique:true},
// description: {type:String, required:true,},
// price: {type:number,  required:true},
// currencyId: {type:String, required:true},
// currencyFormat: {type:String, required:true},
// isFreeShipping: {type:boolean, default: false},
// productImage: {type:String, required:true},  // s3 link
// style: {type:String},
// availableSizes: {type: String,required:true, enum:["S", "XS","M","X", "L","XXL", "XL"]},
// installments: {type:Number},
// deletedAt: {type:Number}, 
// isDeleted: {boolean, default: false}

let createProduct = async function (req, res) {
    try {
        let requestBody = req.body
        if (!isvalidRequest(requestBody)) return res.send({ status: false, msg: "requestbody is empty " })
        let { title, description, price, currencyId, currencyFormat, availableSizes, installments,style } = requestBody
        if (!isValid(title)) return res.status(400).send({ status: true, msg: "title is required" })
        if (!isValidName(title)) return res.status(400).send({ status: true, msg: "title is invalid" })
        let findTitle = await productModel.findOne({ title: title })
        if (findTitle) return res.status(400).send({ status: false, msg: "title is already present" })

        if (!isValid(description)) return res.status(400).send({ status: true, msg: "description is required" })
        if (!isValidName(description)) return res.status(400).send({ status: true, msg: "description is invalid" })

        if (!isValid(price)) return res.status(400).send({ status: false, msg: "price is required" })
        if (!isValidNum(price)) {
            return res.status(400).send({ status: false, message: 'price is invalid' })
        }
        if (!isValid(currencyId)) return res.status(400).send({ status: false, msg: "currencyId is required" })
        if (currencyId != "INR") return res.status(400).send({ status: false, msg: "currencyid is only accpet INR" })

        if (!isValid(currencyFormat)) return res.status(400).send({ status: false, msg: "currencyformat is required" })
        if (currencyFormat != "₹") return res.status(400).send({ status: false, msg: "currencyformat is only accpet ₹" })
        if(!isValidName(style)) return res.status(400).send({status:false,msg:"style is not correct format"})
        if (availableSizes) {
            var availableSize = availableSizes.toUpperCase().split(",")
         console.log(availableSize)
            for (let i = 0; i < availableSize.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i]))
                    return res.status(400).send({ status: false, msg: `size should ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
            }
        }
        if (!isValidNum(installments)) return res.status(400).send({ status: false, msg: "installment not in correct format" })

        let file = req.files;
        console.log(file);
        if (file && file.length > 0) {

            let uploadedFileURL = await uploadFile(file[0]);

            requestBody["productImage"] = uploadedFileURL;
        } else {
            return res.status(400).send({ status: false, message: "No file found" });
        }
        let newProduct = await productModel.create(requestBody)
        return res.status(201).send({ status: false, msg: "product is sucessfully created", data: newProduct })
    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: err.message })
    }

}

const getproductbyId = async function(req,res){
    try{
        let proId = req.params.productId
        // console
        if(!proId) return res.status(400).send({status:false,msg:"enter Product Id"})

        let validId=isValidObjectId(proId)
    if(!validId){return res.status(400).send({status:false,msg:"enter valid prodId"})}
    let product = await productModel.findOne({ _id: proId, isDeleted: false })

    if (!product) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })
    res.status(200).send({ status: true, message:"Success", data: product })
}
catch (err) {
    console.log(err.message);
    return res.status(500).send({ status: false, message: err.message });
}
}

const deleteprodbyId = async function(req,res){
    try{
        let proId = req.params.productId
        if(!proId) return res.status(400).send({status:false,msg:"enter Product Id"})

        let validId=isValidObjectId(proId)
    if(!validId){return res.status(400).send({status:false,msg:"enter valid prodId"})}
    let product = await productModel.findOne({ _id: proId, isDeleted: false })

    if (!product) return res.status(404).send({ status: false, message: "product has already been deleted" })

    let deleteProduct = await productModel.findOneAndUpdate({ _id: proId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
        res.status(200).send({ status: true, message: 'Success', data: deleteProduct })
       // res.status(200).send({ status: true, message: 'Success' })
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send({ status: false, message: err.message });
    }
}

module.exports.createProduct = createProduct
module.exports.getproductbyId=getproductbyId
module.exports.deleteprodbyId=deleteprodbyId