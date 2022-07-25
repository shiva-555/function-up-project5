const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
let {uploadFile} = require("../Aws/aws")
const bcrypt =require("bcrypt")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    if (typeof value === "number" && value.toString().trim().length ===0) return false
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
const isValidPinCode = function (value) {
    const pincode = /^(\d{4}|\d{6})$/
    return pincode.test(value)
}
const isValidNumber = function (value) {
    const number = /^[6-9]{1}[0-9]{9}$/im
    return number.test(value)
  }
  const isValidPassword = function (value) {
    const password = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/
    return password.test(value)
  }


const createUser=async function (req,res){
    try{
let requestBody = req.body
        
        //validation for request body
        if (!isvalidRequest(requestBody)) return res.status(400).send({ status: false, message: "Invalid request, please provide details" })
         
        //destructring request body
        let { fname, lname, email, phone, password } = requestBody
        
        //validation for fname
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }
        if (!isValidName(fname)) {
            return res.status(400).send({ status: false, message: "First name should be alphabetical" })
        }

        //validation for lname
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }
        if (!isValidName(lname)) {
            return res.status(400).send({ status: false, message: "Last name should be alphabetical " })
        }

        //validation for email
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is not valid" })
        }

        //checking for unique email address in db
        let uniqueEmail = await userModel.findOne({ email: email })
        if (uniqueEmail) {
            return res.status(409).send({ status: false, msg: "Email already exist" })
        }

        //validation for phone
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone is required" })
        }
        if (!isValidNumber(phone)) {
            return res.status(400).send({ status: false, message: "Phone no. is not valid" })
        }

        //checking for unique phone number in db
        let uniquePhone = await userModel.findOne({ phone: phone })

        //document is present
        if (uniquePhone) {
            return res.status(409).send({ status: false, message: "Phone number already exist" })
        }

        //validation for password
        if (!isValid(password))
            return res.status(400).send({ status: false, message: "Password is a mendatory field" })

        if (!isValidPassword(password))
            return res.status(400).send({ status: false, message: `Password  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })

            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);
            console.log(password)
    
        // validation for address     
        
        let double = JSON.parse(requestBody.address);
        console.log(double)

        if (typeof double != "object") {
            return res.status(400).send({ status: false, message: "address should be an object" });
        }
        const { shipping, billing } =double;
         console.log(shipping);


        if (!shipping) {
            return res.status(400).send({ status: false, message: "shipping address is required" });
        }

        if (typeof shipping != "object") {
            return res.status(400).send({ status: false, message: "shipping should be an object" });
        }
        let {street,city,pincode}=shipping
        if (!(street)) {
            return res.status(400).send({ status: false, message: "shippinggfgvbcbcb street is required" });
        }

        if (!(city)) {
            return res.status(400).send({ status: false, message: "shipping city is required" });
        }

        if (!isValidName(city)) {
            return res.status(400).send({status: false, message: "city field have to fill by alpha characters"});
        }

        if (!(pincode)) {
            return res.status(400).send({ status: false, message: "shipping pincode is required" });
        }

        //applicable only for numeric values and extend to be 6 characters only--
        if (!isValidPinCode(pincode)) {
            return res.status(400).send({ status: false, message: "plz enter valid pincode" });
        }

        if (!billing) {
            return res.status(400).send({ status: false, message: "billing address is required" });
        }

        if (typeof billing != "object") {
            return res.status(400).send({ status: false, message: "billing should be an object" });
        }

        if (!isValid(billing.street)) {
            return res.status(400).send({ status: false, message: "billing street is required" });
        }

        if (!isValid(billing.city)) {
            return res.status(400).send({ status: false, message: "billing city is required" });
        }
        if (!isValidName(billing.city)) {
            return res.status(400).send({status: false,message: "city field have to fill by alpha characters"});
        }

        if (!isValid(billing.pincode)) {
            return res.status(400).send({ status: false, message: "billing pincode is required" });
        }

        //applicable only for numeric values and extend to be 6 characters only--
        if (!isValidPinCode(billing.pincode)) {
            return res.status(400).send({ status: false, message: "plz enter valid  billing pincode" });
        }
        requestBody.address=double

        let file = req.files;
        console.log(file);
        if (file && file.length > 0) {

            let uploadedFileURL = await uploadFile(file[0]);

            requestBody["profileImage"] = uploadedFileURL;
        } else {
            return res.status(400).send({ status: false, message: "No file found" });
        }
        let savedData= await userModel.create(requestBody)
        return res.status(201).send({status:true,data:savedData})
       
    } catch (err) {

        return res.status(500).send({ status: false, message: err.message })
    }

}

    module.exports.createUser = createUser