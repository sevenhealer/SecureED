const express = require('express');
const { userModel } = require('../db')

const userRouter = express.Router();

userRouter.post('/signup', async(req, res) => {
    const { username, password } = req.body;
    try{
        await userModel.create({ username, password })
        return res.send("Signup Successful");
    }catch(err){
        console.log(err)
        return res.send("Signup Failed");
    }
});
userRouter.post('/signin', async(req, res) => {
    const { username, password } = req.body;
    try{
        const user = await userModel.findOne({ username })
        console.log(user);
        if(user.password != password) return res.status(403).send("Wrong Password");
        return res.send("Signin Successfully")
    }catch(err){
        console.log(err)
        return res.send("Signin Failed");
    }
});
userRouter.get('/purchase', (req, res) => {
    
});
userRouter.get('/course', (req, res) => {
    res.send("All Courses")
});

module.exports = userRouter