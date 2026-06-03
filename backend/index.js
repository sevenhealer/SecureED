const express = require('express')
const userRouter = require('./routes/userRoutes')
const creatorRouter = require('./routes/creatorRoutes')
const path = require('path')
const cors = require('cors')
const fs = require('fs')
const { videoModel } = require('./models/db')


const app = express();

app.use(cors());
app.use("/bucket/videos", express.static(path.join(__dirname, "/bucket/videos")));

app.use(express.json())

app.use('/user', userRouter);
app.use('/creator', creatorRouter);

app.get('/keys/:kid', async (req, res) => {
    const { kid } = req.params;
    console.log(kid)
    try {
        const video = await videoModel.findOne({ kid });
        if (!video) {
            return res.status(404).json({ error: 'Key not found' });
        }

        const keyFilePath = path.join(__dirname, `${video.key_path}`);
        
        if (!fs.existsSync(keyFilePath)) {
            return res.status(404).json({ error: 'Key file not found on disk' });
        }

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        fs.createReadStream(keyFilePath).pipe(res);
    } catch (error) {
        console.error('Key retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve key' });
    }
});


app.listen(3000, () => {
    console.log("Listining on PORT 3000");
})