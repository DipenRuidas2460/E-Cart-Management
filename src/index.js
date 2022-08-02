const express = require('express');
// const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const { default: mongoose } = require('mongoose');
const app = express();

const multer = require("multer");


app.use(express.json());

// app.use(bodyParser.urlencoded({ extended: true }));

app.use(multer().any())

mongoose.connect("mongodb+srv://shilpikumari:shilpi1234@cluster0.phpas.mongodb.net/group-20_ProductProject"
    , {
        useNewUrlParser: true
    })
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use('/', route);
app.use((req, res, next) => {
    res.status(404).send({ status: false, msg: `Not found ${req.url}` })
    next()
})


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});