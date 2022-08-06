const jwt = require('jsonwebtoken')
const userModel = require ("../models/userModel")
const mongoose=require("mongoose")
const isValidObjectId = function (id) {
    var ObjectId = mongoose.Types.ObjectId;
    return ObjectId.isValid(id)
}


const authentication = async function (req, res, next) {

    try {
  
       let token = (req.headers.authorization)
      
  
      // if token is not provided
      if (!token) {
        return res.status(400).send({ status: false, msg: "Token required! Please login to generate token" });
      }
      let newtoken=token.split(" ")
  
      jwt.verify(newtoken[1], "Group7", { ignoreExpiration: true }, function (error, decodedToken) {
        // if token is not valid
        if (error) {
          return res.status(401).send({ status: false, msg: "Token is invalid!" });
  
          // if token is valid
        } else {
          // checking if token session expired
          if (Date.now() > decodedToken.exp * 1000) {
            return res.status(401).send({ status: false, msg: "Session Expired" });
          }
          //exposing decoded token userId in request for everywhere access
          req.userId = decodedToken.userId;
          next();
  
        }
      }
      )
    
    } catch (err) {
      res.status(500).send({ msg: "Internal Server Error", error: err.message });
    }
}
const authorisation = async function (req, res, next) {
    try {
      // userId sent through path params
      let userId = req.params.userId;
  
      // CASE-1: useId is empty
      if (userId === ":userId") {
        return res
          .status(400)
          .send({ status: false, msg: "Please enter userId to proceed!" });
      }
      // CASE-2: userId is not an ObjectId
      else if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, msg: "userId is invalid!" });
      }
      // CASE-3: userId does not exist (in our database)
      let user = await userModel.findOne({ _id: userId }); // database call
      // console.log(user);
      if (!user) {
        return res.status(400).send({
          status: false,
          msg: "We are sorry; Given userId does not exist!",
        });
      }
  
      // Authorisation: userId in token is compared with userId against bookId
      if (req.userId !== userId) {
        return res.status(403).send({
          status: false,
          msg: `Authorisation Failed! You are logged in ${req.userId} not as ${userId}`,
        });
      } else if (req.userId === userId) {
        next();
      }
    } catch (err) {
      res.status(500).send({ msg: "Internal Server Error", error: err.message });
    }
  };
  

module.exports.authentication = authentication;
module.exports.authorisation = authorisation;

