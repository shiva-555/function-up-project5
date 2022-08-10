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

  const isNumber = function (value){
    const number = /[0-9]/
    return number.test(value)
}
const validInstallment = function (value) {
    const installRegex = /^[0-9]{1,2}$/
    return installRegex.test(value)
}

const isValidTitle =function(title){
    const  titleRegex =/[a-zA-Z0-9 ]/
    return titleRegex.test(title)
}

const isValidObjectId = function (id) {
    var ObjectId = mongoose.Types.ObjectId;
    return ObjectId.isValid(id)
}

//=========================createProduct======================================
const createProduct = async function (req, res) {
    try {
        let data = req.body;
        if (!isvalidRequest(data)) { return res.status(400).send({ status: false, message: "Insert Data : BAD REQUEST" }); }


        //*************************** [DESTRUCTURINGP DATA] ********************/

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, installments } = data;

        //*************************** [CHECKING VALIDATION OF REQUIRED :TRUE] ********************/


        if (!isValid(title)) { return res.status(400).send({ status: false, message: "Please Provide Title" }) }
        if (!isValid(description)) { return res.status(400).send({ status: false, message: "Please Provide description" }) }
        if (!isValid(price)) { return res.status(400).send({ status: false, message: "Please Provide price" }) }
        if (!isValid(currencyId)) { return res.status(400).send({ status: false, message: "Please Provide currencyId" }) }
        if (!isValid(currencyFormat)) { return res.status(400).send({ status: false, message: "Please Provide currencyFormat" }) }

        /*************************** [Style Validation] ********************/

        if (!isValid(style)) { return res.status(400).send({ status: false, message: "Please Enter Valid Style" }) }

        //*************************** [Prize Validation] ********************/

        if (!isValid(price))
            return res.status(400).send({ status: false, message: "price required" });
        if (price == 0)
            return res.status(400).send({ status: false, message: "price can't be 0" })
        if (!price.match(/^\d{0,8}(\.\d{1,4})?$/))
            return res.status(400).send({ status: false, message: "price invalid" })

                    //*************************** [Title Validation] ********************/


        if (!isValidTitle(title)) { return res.status(400).send({ status: false, message: "Enter a Valid Title" }) }

        let checkTitle = await productModel.findOne({ title: title })
        if (checkTitle) return res.status(400).send({ status: false, message: "Title already exists" })


        //*************************** [Currency Id Validation] *****************/

        if (currencyId.trim() !== 'INR')
            return res.status(400).send({ status: false, message: "currencyId must be INR only" });

        //*************************** [Currency Format Validation] ************/

        if (currencyFormat.trim() !== '₹')
            return res.status(400).send({ status: false, message: "currencyformat must be ₹ only" });

        //*************************** [Installments Validation] ************/

        if (isValid(installments)) {
            if (!validInstallment(installments))
                return res.status(400).send({ status: false, message: "Installment is Invalid :Enter 2 digit Number" });
        }

        //*************************** [Available Sizes Validation] ************/


        let availableSizes = req.body.availableSizes.split(",").map(x => x.toUpperCase().trim())

        for (let i = 0; i < availableSizes.length; i++) {       // <=== running a for loop here

            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                // console.log(availableSizes[i])
                return res.status(400).send({ status: false, message: "Size should be among ['S','XS','M','X','L','XXL','XL'] only!" })
            }

            if (availableSizes.indexOf(availableSizes[i]) != i) {
                return res.status(400).send({ status: false, message: "Size not present!" })
            }
        }
        data.availableSizes = availableSizes

        //*************************** [isFreeShipping Validation] ************/

        if (typeof isFreeShipping != 'undefined') {
            isFreeShipping = isFreeShipping.trim()
            if (!["true", "false"].includes(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "isFreeshipping is a boolean type only :Ex- true / false" });
            }
        }

        //*************************** [Product Image Validation] ************/

        let files = req.files
        if (!(files && files.length > 0)) {
            return res.status(400).send({ status: false, message: "Please Provide Product Image" });
        }
        let uploadedproductImage = await uploadFile(files[0])
        data.productImage = uploadedproductImage

        //*************************** [Creating Data] ***********************/

        let CreatedData = await productModel.create(data)
        res.status(201).send({ status: true, message: 'Success', data: CreatedData })
        
    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, messege: err.message })
    }

}

//================================getallproduct=====================================================k
const getallProducts = async function (req, res) {
    try {
        let filter = req.query;
        let query = { isDeleted: false };


        if (filter) {
            const { name, size, priceSort, priceGreaterThan, priceLessThan } = filter;

            //*************************** [Filtering By Size] ***********************/

            if (isValid(size)) {
                if (!isValid(size)) { return res.status(400).send({ status: false, message: "Enter size" }) }
                query['availableSizes'] = size.toUpperCase()
            }

            //*************************** [Filtering By Name] ***********************/


            if (isValid(name)) { query['title'] = name }

            //*************************** [Filtering By Price Greater Than] ***********************/

            if (isValid(priceGreaterThan)) {
                if (!isNumber(priceGreaterThan)) { return res.status(400).send({ status: false, messsage: "Enter a valid price in priceGreaterThan" }) }
                query['price'] = { '$gt': priceGreaterThan }
            }


            //*************************** [Filtering By Price less Than] ***********************/

            if (isValid(priceLessThan)) {
                if (!isNumber(priceLessThan)) { return res.status(400).send({ status: false, messsage: "Enter a valid price in priceLessThan" }) }
                query['price'] = { '$lt': priceLessThan }
            }
            if (priceLessThan && priceGreaterThan) { query['price'] = { '$lte': priceLessThan, '$gte': priceGreaterThan } }

            //*************************** [Filtering By Price sort] ***********************/

            if (priceSort) {
                if ((priceSort == 1 || priceSort == -1)) {
                    let filterProduct = await productModel.find(query).sort({ price: priceSort })

                    if (!filterProduct) {
                        return res.status(404).send({ status: false, message: "No products found with this query" })
                    }
                    return res.status(200).send({ status: false, message: "Success", data: filterProduct })
                }
                return res.status(400).send({ status: false, message: "priceSort must have 1 or -1 as input" })
            }
        }

        let data = await productModel.find(query).sort({ price: -1 }); 

        if (data.length == 0) {
            return res.status(400).send({ status: false, message: "NO data found" });
        }

        return res.status(200).send({ status: true, message: "Success",count: data.length, data: data });


    } catch (err) {
        return res.status(500).send({ status: false, message: err });
    }
};


//=======================getproduct by id=================================
const getproductbyId = async function (req, res) {
    try {
        let proId = req.params.productId
        // console
        if (!proId) return res.status(400).send({ status: false, messege: "enter Product Id" })

        if (!isValidObjectId(proId)) { return res.status(400).send({ status: false, messege: "enter valid productId" }) }
        let product = await productModel.findOne({ _id: proId, isDeleted: false })
        //console.log(product)

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