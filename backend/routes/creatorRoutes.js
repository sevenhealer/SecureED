const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require("child_process");
const { creatorModel, courseModel, videoModel } = require('../models/db');
const generateToken = require('../utils/generateToken');
const authMiddleware = require('../middlewire/authMiddleware');

const creatorRouter = express.Router();

creatorRouter.post('/signup', async (req, res) => {
    const { username, password } = req.body
    try {
        await creatorModel.create({ username, password })
        return res.send("Signup Completed");
    } catch (err) {
        console.log(err);
        return res.send("Signup Failed");
    }
})

creatorRouter.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await creatorModel.findOne({ username })
        if (!user) return res.status(401).json({ error: 'Invalid Username' });
        if (user.password != password) return res.status(403).send("Invalid Password");
        const token = generateToken(user);
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.log(err)
        return res.send("Signin Failed");
    }
});

creatorRouter.post('/createCourse', authMiddleware, async (req, res) => {
    const { courseName, iconUrl, description, price } = req.body;
    const creatorId = req.user.id;

    try {
        const course = await courseModel.create({
            courseName,
            iconUrl,
            description,
            creatorId,
            price
        });

        res.status(201).json({
            message: 'Course created successfully',
            course
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create course' });
    }
});


const currentDir = path.join(__dirname, '../bucket/');

storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, currentDir + 'videos')
    },
    filename: (req, file, cb) => {
        const uniqueName = file.fieldname + '-' + uuid.v4() + path.extname(file.originalname)
        cb(null, uniqueName)
    }
})

const upload = multer({ storage: storage })

creatorRouter.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    const { courseId, title } = req.body;
    const creatorId = req.user.id;
    console.log(req.file)
    console.log(courseId)
    console.log(currentDir)

    try {
        const course = await courseModel.findById(courseId);
        if (!course) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.creatorId.toString() !== creatorId) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const lessionId = uuid.v4();
        const kid = crypto.randomUUID();
        const videoPath = req.file.path;
        const videosDir = path.join(currentDir, 'videos')
        const lessonOutputDir = path.join(videosDir, lessionId);
        const keyBuffer = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16).toString('hex');

        if (!fs.existsSync(lessonOutputDir)) {
            fs.mkdirSync(lessonOutputDir, { recursive: true });
        }

        ['v0', 'v1', 'v2', 'v3', 'v4'].forEach((variant) => {
            const variantDir = path.join(lessonOutputDir, variant);
            if (!fs.existsSync(variantDir)) {
                fs.mkdirSync(variantDir, { recursive: true });
            }
        });

        const keysDir = path.join(currentDir, 'keys');
        const keyFilePath = path.join(keysDir, `${lessionId}.key`);
        fs.writeFileSync(keyFilePath, keyBuffer);

        // ffmpeg key
        const keyInfoPath = path.join(keysDir, `${lessionId}.keyinfo`);
        const keyUri = `http://localhost:3000/keys/${kid}`;
        fs.writeFileSync(keyInfoPath, `${keyUri}\n${keyFilePath}\n${iv}`);

        //HLS encoding(AES-128)
        const ffmpegArgs = [
            '-y',
            '-i', videoPath,
            '-filter_complex',
            `[0:v]split=5[v1080][v720][v480][v360][v240];` +
            `[v1080]scale=1920:-2:force_original_aspect_ratio=decrease,setsar=1,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v1080o];` +
            `[v720]scale=1280:-2:force_original_aspect_ratio=decrease,setsar=1,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v720o];` +
            `[v480]scale=854:-2:force_original_aspect_ratio=decrease,setsar=1,pad=854:480:(ow-iw)/2:(oh-ih)/2[v480o];` +
            `[v360]scale=640:-2:force_original_aspect_ratio=decrease,setsar=1,pad=640:360:(ow-iw)/2:(oh-ih)/2[v360o];` +
            `[v240]scale=426:-2:force_original_aspect_ratio=decrease,setsar=1,pad=426:240:(ow-iw)/2:(oh-ih)/2[v240o]`,
            '-map', '[v1080o]', '-map', '0:a:0', '-c:v:0', 'libx264', '-profile:v:0', 'high', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-b:v:0', '5000k', '-maxrate:v:0', '5350k', '-bufsize:v:0', '7500k', '-c:a:0', 'aac', '-b:a:0', '128k', '-ac:0', '2',
            '-map', '[v720o]', '-map', '0:a:0', '-c:v:1', 'libx264', '-profile:v:1', 'high', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-b:v:1', '3000k', '-maxrate:v:1', '3210k', '-bufsize:v:1', '4500k', '-c:a:1', 'aac', '-b:a:1', '128k', '-ac:1', '2',
            '-map', '[v480o]', '-map', '0:a:0', '-c:v:2', 'libx264', '-profile:v:2', 'main', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-b:v:2', '1600k', '-maxrate:v:2', '1710k', '-bufsize:v:2', '2400k', '-c:a:2', 'aac', '-b:a:2', '96k', '-ac:2', '2',
            '-map', '[v360o]', '-map', '0:a:0', '-c:v:3', 'libx264', '-profile:v:3', 'main', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-b:v:3', '800k', '-maxrate:v:3', '856k', '-bufsize:v:3', '1200k', '-c:a:3', 'aac', '-b:a:3', '96k', '-ac:3', '2',
            '-map', '[v240o]', '-map', '0:a:0', '-c:v:4', 'libx264', '-profile:v:4', 'baseline', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-b:v:4', '400k', '-maxrate:v:4', '428k', '-bufsize:v:4', '600k', '-c:a:4', 'aac', '-b:a:4', '64k', '-ac:4', '2',
            '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-x264-params', 'scenecut=0',
            '-f', 'hls', '-hls_time', '10', '-hls_playlist_type', 'vod', '-hls_list_size', '0',
            '-hls_flags', 'independent_segments',
            '-hls_key_info_file', keyInfoPath,
            '-master_pl_name', 'index.m3u8',
            '-hls_segment_filename', path.join(lessonOutputDir, 'v%v', 'seg_%03d.ts'),
            '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3 v:4,a:4',
            path.join(lessonOutputDir, 'v%v', 'index.m3u8')
        ];

        // Spawn FFmpeg process
        const ff = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        ff.on('close', async (code) => {
            try {
                if (code !== 0) {
                    console.error('FFmpeg failed with code:', code);
                    // Cleanup on failure
                    fs.rmSync(lessonOutputDir, { recursive: true, force: true });
                    fs.unlinkSync(keyFilePath);
                    fs.unlinkSync(keyInfoPath);
                    fs.unlinkSync(videoPath);
                    return res.status(500).json({ error: 'Video encoding failed' });
                }

                const video = await videoModel.create({
                    title: title || `Video ${lessionId}`,
                    courseId,
                    creatorId,
                    lessionId,
                    kid,
                    encryption_iv: iv,
                    s3_path: `/bucket/videos/${lessionId}/index.m3u8`,
                    key_path: `/bucket/keys/${lessionId}.key`,
                    playlistUrl: `http://localhost:3000/bucket/videos/${lessionId}/index.m3u8`,
                    keyUrl: `http://localhost:3000/bucket/keys/${kid}`,
                    status: 'completed',
                    metadata: {
                        masterPlaylist: `${lessionId}/index.m3u8`,
                        keyPath: `${lessionId}.key`,
                        variants: ['v0', 'v1', 'v2', 'v3', 'v4'],
                        bitrates: {
                            v0: '5000k (1920x1080)',
                            v1: '3000k (1280x720)',
                            v2: '1600k (854x480)',
                            v3: '800k (640x360)',
                            v4: '400k (426x240)'
                        }
                    },
                    createdAt: new Date()
                });

                fs.unlinkSync(videoPath);

                res.status(201).json({
                    message: 'Video successfully encoded and stored',
                    video: {
                        _id: video._id,
                        title: video.title,
                        lessionId: video.lessionId,
                        kid: video.kid,
                        playlistUrl: video.playlistUrl,
                        keyUrl: video.keyUrl,
                        status: video.status
                    }
                });
            } catch (error) {
                console.error('Database save error:', error);
                res.status(500).json({ error: 'Failed to save video metadata' });
            }
        });

        ff.stderr.on('data', (data) => {
            console.log(`FFmpeg: ${data}`);
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Upload processing failed' });
    }
});




module.exports = creatorRouter;