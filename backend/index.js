const express = require('express')
const userRouter = require('./routes/userRoutes')

const app = express();
app.use(express.json())

app.use('/user', userRouter);
// app.use('/courseCreator', creatorRouter);


app.listen(3000, () => {
    console.log("Listining on PORT 3000");
})