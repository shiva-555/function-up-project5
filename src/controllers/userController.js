const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
let stroageController=require("../controllers/storageController")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
     if (typeof value === "string")
    return true;
};
const isvalidRequest = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidName = function (value) {
    const dateName = /^[a-zA-Z_ ]{2,100}$/
    return dateName.test(value)
  }
  const isValidEmail = function (value) {
    const email = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
    return email.test(value)
  }

const createUser= async function(req,res){
    let requestBody=req.body
    if(!isvalidRequest(requestBody)) return res.status(400).send({status:false,msg:"request body is empty"})
    let {fname,lname,email,profileImage,phone,password,address}=requestBody
    if(!isValid(fname)) return res.status(400).send({msg:"fname is required"})
    if(!isValidName(fname)) return res.status(400).send({msg:"fname is notvalid"})
    if(!isValid(lname)) return res.status(400).send({msg:"fname is required"})
    if(!isValidName(lname)) return res.status(400).send({msg:"fname is notvalid"})
    if(!isValid(email)) return res.status(400).send({msg:"email is required"})
    if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "email Id is invalid" })
    let Email= await userModel.findOne(email)
    if(!Email) return res.status(400).send({msg:"email is already present"})

    if (!isValid(phone)) {
        return res.status(400).send({ status: false,message: "Phone number is required" })
    }
    if (!(/^[6-9]{1}[0-9]{9}$/im.test(phone))) return res.status(400).send({ status: false, message: "Phone number is invalid. +91 is not required" })
    let checkNumber = await userModel.findOne({ phone })
    if (checkNumber) return res.status(404).send({ status: false, message: "Phone Number is already in use" })

    if (!isValid(password)) { return res.status(400).send({ status: false, msg: "Password is required" }) }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/.test(password))
     { return res.status(400).send({ status: false, msg: "Password is invalid" }) }

    if (!isValid(address)) { return res.status(400).send({ status: false, msg: "Password is required" }) }
        if (address) {
            
            if(!isValid(address.shipping)){
                return res.status(400).send({status:false,msg:"shipping is required"})
        }
        if(shipping){
            if(!isValid(address.shipping.street)){
                return res.status(400).send({status:false,msg:"Street is required"})
            }
            if(!isValid(address.shipping.city)){
                return res.status(400).send({status:false,msg:"City is required"})
            }
            if(!/^(\d{4}|\d{6})$/.test(address.shipping.pincode)){
                return res.status(400).send({status:false,msg:"Pincode is required"})
            }
        }
        if(!isValid(billing)){
            return res.status(400).send({status:false,msg:"shipping is required"})
        }
        if(billing){
            if(!isValid(address.billing.street)){
                return res.status(400).send({status:false,msg:"Street is required"})
            }
            if(!isValid(address.billing.city)){
                return res.status(400).send({status:false,msg:"City is required"})
            }
            if(!/^(\d{4}|\d{6})$/.test(address.billing.pincode)){
                return res.status(400).send({status:false,msg:"Pincode is required"})
            }
        }
        let files= req.files
        console.log(files)
            if (files.length==0) res.status(400).send({msg:"no file found"})
            let uploadedUserCoverURL= await stroageController.uploadFile( files[0] )
        requestBody.profileImage=uploadedUserCoverURL
    }
    let savedData = await userModel.create(requestBody)
        {return res.status(201).send({status:true,data:savedData})}
    
}
module.exports.createUser=createUser