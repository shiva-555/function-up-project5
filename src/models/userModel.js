const mongoose = require('mongoose')
// const ObjectId = mongoose.Types.ObjectId
const userSchema = new mongoose.Schema({
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String, required: true }, // s3 link
    phone: {
        type: String, required: true, unique: true,
    },
    password: { type: String, required: true }, // encrypted password
    address: {
        shipping: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            pincode: { type: Number, required: true }
        },
        billing: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            pincode: { type: Number, required: true }
        }
    }

},{timestamps:true})
module.exports=mongoose.model("User",userSchema)










// const updateprofile = async function (req, res) {
//     try {
//         let userId = req.params.userId
//         // let files = req.file
//         let data = req.body
//         if (!isValidObjectId(userId))
//             return res.status(400).send({ status: false, msg: "userId is Invalid" });


//         // /check if id is present in Db or Not ? 
//         let user = await userModel.findById({ _id: userId })
//         // console.log(user)
//         if (!user) return res.status(404).send({ status: false, msg: "userId is not present in DB " })


//         //check if the data in request body is present or not ?
//         let { fname, lname, email, phone, password ,address} = data



//         //validation for fname
//         //
//         if (fname) {
//             if (!isValid(fname)) {
//                 return res.status(400).send({ status: false, message: "fname is required" })
//             }
//             if (!isValidName(fname)) {
//                 return res.status(400).send({ status: false, message: "First name should be alphabetical" })
//             }
//         }
//         // console.log(fname)

//         //validation for lname

//         if (lname) {
//             if (!isValid(lname)) {
//                 return res.status(400).send({ status: false, message: "lname is required" })
//             }
//             if (!isValidName(lname)) {
//                 return res.status(400).send({ status: false, message: "Last name should be alphabetical " })
//             }
//         }

//         //validation for email

//         if (email) {
//             if (!isValid(email)) {
//                 return res.status(400).send({ status: false, message: "Email is required" })
//             }
//             if (!isValidEmail(email)) {
//                 return res.status(400).send({ status: false, message: "Email is not valid" })
//             }
//         }

//         //validation for phone

//         if (phone) {
//             if (!isValid(phone)) {
//                 return res.status(400).send({ status: false, message: "Phone is required" })
//             }
//             if (!isValidNumber(phone)) {
//                 return res.status(400).send({ status: false, message: "Phone no. is not valid" })
//             }
//         }

//         //validation for password

//         if (password) {
//             if (!isValid(password))
//                 return res.status(400).send({ status: false, message: "Password is a mendatory field" })
//             if (!isValidPassword(password))
//             return res.status(400).send({ status: false, message: `Password  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })
//             let checkpass = await bcrypt.compare(password, user.password)
//             // console.log(checkpass)
//             if (!checkpass) return res.status(401).send({ status: false, msg: "password is not matching" })
    
//             const encryptPassword = await bcrypt.hash(password, 10)
//             console.log(encryptPassword)
//             requestBody.password = encryptPassword

//         }
//         //validations for address
//         if (!isValid(address)) {
//             return res.status(400).send({ status: false, message: 'Address is Required' })
//         }
//         if (address) {

//             if (!isValid(data.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });

//             address = JSON.parse(address)

//             let tempAddress = userProfile.address

//             if (address.shipping) {

//                 if (!isValid(address.shipping)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });

//                 if (address.shipping.street) {
//                     if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Street of shipping address should be valid and not an empty string" });

//                     tempAddress.shipping.street = address.shipping.street
//                 }


//                 if (address.shipping.city) {
//                     if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "City of shipping address should be valid and not an empty string" });

//                     tempAddress.shipping.city = address.shipping.city
//                 }


//                 if (address.shipping.pincode) {
//                     if (!isValid(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode of shipping address and should not be an empty string" });

//                     if (!isValidPinCode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });



//                     tempAddress.shipping.pincode = address.shipping.pincode;
//                 }
//             }

//             if (address.billing) {

//                 if (!isValid(address.billing)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });

//                 if (address.billing.street) {
//                     if (!isValid(address.billing.street)) return res.status(400).send({ status: false, message: "Street of billing address should be valid and not an empty string" });

//                     tempAddress.billing.street = address.billing.street
//                 }


//                 if (address.billing.city) {
//                     if (!isValid(address.billing.city)) return res.status(400).send({ status: false, message: "City of billing address should be valid and not an empty string" });

//                     tempAddress.billing.city = address.billing.city
//                 }


//                 if (address.billing.pincode) {
//                     if (!isValid(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode of billing address and should not be an empty string" });

//                     if (!isValidPinCode(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });


//                     tempAddress.billing.pincode = address.billing.pincode;
//                 }
//             }

//             data.address = tempAddress;
//         }

//         //updating doucument of user
//         let updateUser = await userModel.findOneAndUpdate(
//             { _id: userId },
//             data,
//             { new: true }
//         )
//         res.status(201).send({ status: true, message: "User profile updated", data: updateUser });

//     } catch (err) {
//         return res.status(500).send({ status: false, msg: err.message })
//     }

// }