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
const createProduct = async function (req, res) {
    try {
        let requestBody = req.body
        if (!isvalidRequest(requestBody)) return res.send({ status: false, messege: "requestbody is empty " })
        let { title, description, price, currencyId, currencyFormat, availableSizes, installments, style,isFreeShipping } = requestBody
        if (!isValid(title)) return res.status(400).send({ status: true, messege: "title is required" })
        if (!isValidName(title)) return res.status(400).send({ status: true, messege: "title is invalid" })
        let findTitle = await productModel.findOne({ title: title })
        if (findTitle) return res.status(400).send({ status: false, messege: "title is already present" })

        if (!isValid(description)) return res.status(400).send({ status: true, messege: "description is required" })
        if (!isValidName(description)) return res.status(400).send({ status: true, messege: "description is invalid" })

        if (!isValid(price)) return res.status(400).send({ status: false, messege: "price is required" })
        if (!isValidNum(price)) {
            return res.status(400).send({ status: false, message: 'price is invalid' })
        }
        if (!isValid(currencyId)) return res.status(400).send({ status: false, messege: "currencyId is required" })
        if (currencyId != "INR") return res.status(400).send({ status: false, messege: "currencyid is only accpet INR" })

        // if (!isValid(currencyFormat)) return res.status(400).send({ status: false, messege: "currencyformat is required" })
        if (currencyFormat != "₹") return res.status(400).send({ status: false, messege: "currencyformat is only accpet ₹" })
        if (!isValidName(style)) return res.status(400).send({ status: false, messege: "style is not correct format" })
        //check for enum ["S", "XS", "M", "X", "L", "XXL", "XL"]
        if(!isValid(availableSizes) ) return res.status(400).send({status:false,messege:"available size require"})
        if (availableSizes) {
            let array = availableSizes.split(",").map(x => x.toUpperCase().trim())
            for (let i = 0; i < array.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                    return res.status(400).send({ status: false, message: 'Sizes only available from ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
                }
            }
            if (Array.isArray(array)) {
                requestBody.availableSizes = array
            }
        }
        if (!isValidNum(installments)) return res.status(400).send({ status: false, messege: "installment not in correct format" })

        let file = req.files;
        console.log(file);
        if (file && file.length > 0) {

            let uploadedFileURL = await uploadFile(file[0]);
            if (!validUrl.isWebUri(uploadedFileURL)) return res.status(400).send({ status: false, messege: "invalid uploadUrl" })

            if (!(/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(uploadedFileURL)) return res.status(400).send({ status: false, messege: "invalid image file" })
            requestBody["productImage"] = uploadedFileURL;
        } else {
            return res.status(400).send({ status: false, message: "No file found" });
        }
        let newProduct = await productModel.create(requestBody)
        return res.status(201).send({ status: false, messege: "product is sucessfully created", data: newProduct })
    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, messege: err.message })
    }

}

//================================getallproduct=====================================================k
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
                return res.status(400).send({ status: false, messege: `Size should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
            }
            filterQuery["availableSizes"] = availsize
        };

        if (priceGreaterThan) {
            if (!(/^(0|[1-9][0-9]*)$/.test(priceGreaterThan)))
                return res.status(400).send({ status: false, messege: "provide priceGreaterThan in numeric format" })
            filterQuery['price'] = { $gt: priceGreaterThan }
        };

        if (priceLessThan) {
            if (!(/^(0|[1-9][0-9]*)$/.test(priceLessThan)))
                return res.status(400).send({ status: false, messege: "provide priceLessThan in numeric format" })
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

        if (!(products.length)) return res.status(404).send({ status: false, messege: 'Product not found' })
        return res.status(200).send({ status: true, messege: "Success", data: products })
    } catch (error) {
        res.status(500).send({ status: false, Error: "Server not responding", message: error.message, });
    }
}

//=======================getproduct by id=================================
const getproductbyId = async function (req, res) {
    try {
        let proId = req.params.productId
        // console
        if (!proId) return res.status(400).send({ status: false, messege: "enter Product Id" })

        if (!isValidObjectId(proId)) { return res.status(400).send({ status: false, messege: "enter valid productId" }) }
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
    try{
    const paramsId = req.params.productId;
        if (!isValidObjectId(paramsId)) {
            return res.status(400).send({ status: false, message: 'Params Id is invalid' })
        }

        let findProduct = await productModel.findOne({ _id: paramsId });

        if (!findProduct) {
            return res.status(404).send({ status: false, message: 'Product is not found' });
        }
        if(findProduct.isDeleted===true){
            return res.status(400).send({sttaus:false,messege:"product is already deleted"})
        }

        let requestBody = req.body;
        if (!isvalidRequest(requestBody)) {
            return res.status(400).send({ status: false, message: "Please enter atleast one key for updation" })
        }
        let file=req.files

        console.log(req.files);
        if (file && file.length > 0) {
            let uploadedFileURL = await uploadFile(file[0]);
            if (!(/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(uploadedFileURL)) return res.status(400).send({ status: false, messege: "invalid image file" })
            requestBody.productImage = uploadedFileURL;
        }
        const { title, description, price, currencyId, currencyFormat, availableSizes,isFreeShipping} = requestBody
        if(title==="") return res.status(400).send({status:false,messege:"title is required"})

        if (title) {
            if (!isValidName(title)) {
                return res.status(400).send({ status: false, message: 'Title is required' })
            }
            //Check for unique title
            const isTitleAlreadyExist = await productModel.findOne({ title })
            if (isTitleAlreadyExist) {
                return res.status(400).send({ status: false, message: 'This Title is already Exist' })
            }
        }
        if(description==="") return res.status(400).send({status:false,messege:"is free shipping required"})

        if (description) {
            if (!isValidName(description)) {
                return res.status(400).send({ status: false, message: 'Description is required' })
            }
        }
        if(price==="") return res.status(400).send({status:false,messege:"price is required"})

        if (price) {
            
            //Check for valid number/decimal
            if (!(/^\d{0,8}[.]?\d{1,4}$/.test(price))) {
                return res.status(400).send({ status: false, message: 'Invalid price' })
            }
        }
        if(currencyId==="") return res.status(400).send({status:false,messege:"price is required"})


        if (currencyId) {
            //Check for INR
            if (currencyId !== "INR") {
                return res.status(400).send({ status: false, message: 'only accepted INR' })
            }
        }
        if(currencyFormat ==="") return res.status(400).send({staus:false,messege:"currencyFormat is required"})

        if (currencyFormat) {
            
            //check for symbol ->
            if (currencyFormat !== "₹") {
                return res.status(400).send({ status: false, message: 'Only accepted ₹ this currency symbol' })
            }
        }

        if(availableSizes ==="") return res.status(400).send({staus:false,messege:"size is required"})
        if (availableSizes) {
            
            let array = availableSizes.split(",").map(x => x.toUpperCase().trim())
            for (let i = 0; i < array.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                    return res.status(400).send({ status: false, message: 'Sizes only available from ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
                }
            }
            if (Array.isArray(array)) {
                requestBody.availableSizes = array
            }
        }
        if(isFreeShipping==="") return res.status(400).send({status:false,messege:"is free shipping required"})
        if(isFreeShipping){
            if(!/^(true|false)$/.test(isFreeShipping)){
                return res.status(400).send({status:false,messege:"please enter only boolean value "})
            }
        }

        let updateData = await productModel.findOneAndUpdate({ _id: findProduct }, requestBody, { new: true })
        res.status(200).send({ status: true, message: 'Product Updated Successfully', data: updateData })
    }catch(err){
        console.log(err.message)
    return res.status(500).send({status:false,messege:err.message})
    }
}
//==============================deleteBy product=========================================

const deleteprodbyId = async function (req, res) {
    try {
        let proId = req.params.productId
        if (!proId) return res.status(400).send({ status: false, messege: "enter Product Id" })

        let validId = isValidObjectId(proId)
        if (!validId) { return res.status(400).send({ status: false, messege: "enter valid prodId" }) }
        let product = await productModel.findOne({ _id: proId,isDeleted:false })

        if (!product) return res.status(404).send({ status: false, message: "product not found " })
        // if (product.isDeleted === true) {
        //     return res.status(400).send({ status: false, message: "product is already deleted"});
        //   }

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