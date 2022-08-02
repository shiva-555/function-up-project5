let productModel = require("../models/productModel")
let { uploadFile } = require("../Aws/aws")
let validUrl = require("valid-url")
// const bcrypt = require("bcrypt")
const mongoose = require("mongoose");
const { query } = require("express");
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
// const isValidSize = function (value) {
//     const size = /[^A-Z]+gi,""/
//     return size.test(value)
// }

const isValidObjectId = function (id) {
    var ObjectId = mongoose.Types.ObjectId;
    return ObjectId.isValid(id)
}

//=========================createProduct======================================
let createProduct = async function (req, res) {
    try {
        let requestBody = req.body
        if (!isvalidRequest(requestBody)) return res.send({ status: false, msg: "requestbody is empty " })
        let { title, description, price, currencyId, currencyFormat, availableSizes, installments, style } = requestBody
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

        // if (!isValid(currencyFormat)) return res.status(400).send({ status: false, msg: "currencyformat is required" })
        if (currencyFormat != "₹") return res.status(400).send({ status: false, msg: "currencyformat is only accpet ₹" })
        if (!isValidName(style)) return res.status(400).send({ status: false, msg: "style is not correct format" })
        if (availableSizes) {
            var availableSize = availableSizes.toUpperCase().split(",")
            // console.log(availableSize)
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
            if (!validUrl.isWebUri(uploadedFileURL)) return res.status(400).send({ status: false, msg: "invalid uploadUrl" })

            if (!(/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(uploadedFileURL)) return res.status(400).send({ status: false, msg: "invalid image file" })
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
const getallProducts = async function (req, res) {
    try {
        const queryParams = req.query
        //Extract params
        let { size, name, priceGreaterThan, priceLessThan, priceSort} = queryParams

        const filterQuery = { isDeleted: false, ...req.query }
        // validation start
        if (size) {
            var availsize = size
            // console.log(availableSize)
            for (let i = 0; i < availsize.length; i++) {
                return res.status(400).send({ status: false, msg: `Size should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
            }
            filterQuery["availableSizes"] = availsize
        };

        if (priceGreaterThan) {
            if (!(/^(0|[1-9][0-9]*)$/.test(priceGreaterThan)))
                return res.status(400).send({ status: false, msg: "provide priceGreaterThan in numeric format" })
            filterQuery['price'] = { $gt: priceGreaterThan }
        };

        if (priceLessThan) {
            if (!(/^(0|[1-9][0-9]*)$/.test(priceLessThan)))
                return res.status(400).send({ status: false, msg: "provide priceLessThan in numeric format" })
            filterQuery['price'] = { $lt: priceLessThan }
        };
       
        if (!isValidName(name)) {
        filterQuery['title'] = name
        };

        // validation of priceSort
        if(priceSort){
            if (!((priceSort == 1) || (priceSort == -1))){
                return res.status(400).send({status : false, message : "Price sort only takes 1 or -1 as a value" })
            }

            let filterProduct = await productModel.find(filterQuery).sort({price: priceSort})
    
            if(filterProduct.length>0){
                return res.status(200).send({status : false, message : "Success", data : filterProduct})
            }
            else{
                return res.status(404).send({status : false, message : "No products found with this query"})
            }
        };
        // validation end

        const products = await productModel.find({ ...filterQuery }).sort({ price: 1 }) //rest operator

        if (!(products.length)) return res.status(404).send({ status: false, msg: 'Product not found' })
        return res.status(200).send({ status: true, msg: "Success", data: products })
    } catch (error) {
        res.status(500).send({ status: false, Error: "Server not responding", message: error.message, });
    }
}

//=======================getproduct by id=================================
const getproductbyId = async function (req, res) {
    try {
        let proId = req.params.productId
        // console
        if (!proId) return res.status(400).send({ status: false, msg: "enter Product Id" })

        if (!isValidObjectId(proId)) { return res.status(400).send({ status: false, msg: "enter valid productId" }) }
        let product = await productModel.findOne({ _id: proId, isDeleted: false })
        console.log(product)

        if (!product) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })
        res.status(200).send({ status: true, message: "Success", data: product })
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send({ status: false, message: err.message });
    }
}
//===================update product=================================================
const updatedProduct = async function (req, res) {
    let productId = req.params.productId;
    let data = req.body
    if (!isvalidRequest(data)) return res.status(400).send({ status: false, msg: "body is empty" })
    if(!isValidObjectId(productId)) return res.status(400).send({status:false,msg:"product id is not valid"})
    let findprod = await productModel.findById({ _id: productId })
    if (!findprod) return res.status(400).send({ status: false, msg: "product id is not found" })
    let { title, description, price, isFreeShipping, style, installments, availableSizes } = data
    // let { title, description, price, currencyId, currencyFormat, availableSizes, installments,style } = requestBody
    if (title === "") return res.status(400).send({ status: false, message: "title can't be empty" })

    if (title) {
        if (!isValidName(title)) return res.status(400).send({ status: false, msg: "title is not in correct format" })
    }
    let findTitle = await productModel.findOne({ title: title })
    if (findTitle) {
        return res.status(400).send({ status: false, msg: "title is Already Present in DB" })
    }
    if (description === "") return res.status(400).send({ status: false, message: "description  can't be empty" })

    if (description) {

        if (!isValidName(description))
            return res.status(400).send({ status: false, msg: "description is not correct format" })
    }
    if (price === "") return res.status(400).send({ status: false, message: "price  can't be empty" })

    if (price) {
        if (!isValidNum(price))
            return res.status(400).send({ status: false, msg: "price is not in correct format" })
    }
    if (style === "") return res.status(400).send({ status: false, message: "price  can't be empty" })

    if (style) {
        if (!isValidName(style)) return res.status(400).send({ status: false, msg: "style is not correct format" })
    }
    if (availableSize === "") return res.status(400).send({ status: false, message: "availableSizes can't be empty" })

    if (availableSizes) {
        var availableSize = availableSizes.toUpperCase()
        //if (!(availableSize)) return res.status(400).send({ status: false, msg: "size is accpt only capital letter" })
        console.log(availableSize)
        for (let i = 0; i < availableSize.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i]))
                return res.status(400).send({ status: false, msg: `size should ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        }
    }
    if (isFreeShipping) {
        if (!/^([Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee])$/.test(isFreeShipping)) return res.send({ status: false, msg: "isfreeShipping is not in correct format" })
    }
    if (installments === "") return res.status(400).send({ status: false, message: "description  can't be empty" })

    if (installments) {
        if (!isValidNum(installments)) return res.status(400).send({ status: false, msg: "installment not in correct format" })
    }
    let file = req.files;

    console.log(file);
    if (file && file.length > 0) {
        // return res.send({status:false,msg:"enter file in body"})

        var uploadedFileURL = await uploadFile(file[0]);
        if (!validUrl.isUri(uploadedFileURL)) return res.status(400).send({ status: false, msg: "invalid uploadUrl" })
        if (!(/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(uploadedFileURL)) return res.status(400).send({ status: false, msg: "invalid image file" })

    }
    const finalProduct = { title, description, price, currencyId: "INR", currencyFormat: "₹", style, installments, availableSizes, productImage: uploadedFileURL, isFreeShipping }

    let updateProduct = await productModel.findByIdAndUpdate(productId, { $set: finalProduct }, { new: true })

    return res.status(200).send({ status: true, msg: "succesfully created", data: updateProduct });

}
//==============================deleteBy product=========================================

const deleteprodbyId = async function (req, res) {
    try {
        let proId = req.params.productId
        if (!proId) return res.status(400).send({ status: false, msg: "enter Product Id" })

        let validId = isValidObjectId(proId)
        if (!validId) { return res.status(400).send({ status: false, msg: "enter valid prodId" }) }
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
module.exports.getallProducts=getallProducts
module.exports.getproductbyId = getproductbyId
module.exports.updatedProduct = updatedProduct
module.exports.deleteprodbyId = deleteprodbyId