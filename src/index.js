const express = require('express');
const bodyParser = require('body-parser');
const multer= require("multer");
const route = require('./route/route.js')
const { AppConfig } = require('aws-sdk');


const { default: mongoose } = require('mongoose'); 
const app = express();

app.use(bodyParser.json());
app.use(multer().any())
app.use(bodyParser.urlencoded({ extended: true }));



mongoose.connect("mongodb+srv://subrat_400:4iQC1DP0ZqKInrD3@cluster0.h3xeivd.mongodb.net/group7-DB",{

    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});
