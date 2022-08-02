const jwt = require('jsonwebtoken')


const authentication = async function (req, res, next) {
    try {
        const token = (req.headers.authorization).split(" ")
        // console.log(token)
        if (!token) return res.status(400).send({ msg: "please provide token" })

        let decodedToken =jwt.verify(token,"Group7", (err, decoded) => {
           
            if (err) {
                return res.status(401).send({msg:"token is invalid"})
            } else {
                if (decoded) {
                    return decoded
                }
            }
        })
        // console.log(decodedToken)
        if(!decodedToken) return res.status(400).send({status:false,msg:"decoded token is invalid"})
        req.userId=decodedToken.userId
        next()
    }
    catch (err) {
        return res.status(500).send(err.message)
    }
}

module.exports.authentication = authentication;
