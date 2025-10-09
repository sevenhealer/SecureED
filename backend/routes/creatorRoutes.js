const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const path = require('path');
const { creatorModel } = require('../db');

const creatorRouter = express.Router();

creatorRouter.post('/signup', async(req, res) => {
    const { username, password } = req.body
    try{
        await creatorModel.create({ username, password })
        return res.send("Signup Completed");
    }catch(err){
        console.log(err);
        return res.send("Signup Failed");
    }
})

creatorRouter.post('/signin', async(req, res) => {
    const { username, password } = req.body;
    try{
        const user = await creatorModel.findOne({ username })
        if(user.password != password) return res.status(403).send("Wrong Password");
        return res.send("Signin Successfully")
    }catch(err){
        console.log(err)
        return res.send("Signin Failed");
    }
});

const videosPath = path.join(__dirname, '../') + 'videos';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, videosPath)
    },
    filename: (req, file, cb) => {
        const uniqueName = file.fieldname + '-' + uuid.v4() + path.extname(file.originalname)
        cb(null, uniqueName)
    }
})

const upload = multer({ storage: storage })

creatorRouter.post('/upload', upload.single('file'), (req, res) => {
    console.log(videosPath)
    res.send("Upload Successful");
})

module.exports = creatorRouter;