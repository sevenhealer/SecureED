const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://user3:temp3@cluster0.glxr7.mongodb.net/SecureED?retryWrites=true&w=majority&appName=Cluster0')
.then(() => {
    console.log("MongoDB connected successfully");
})

const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, required: true },
    password: String,
})

const creatorSchema = new mongoose.Schema({
    name: String,
    username: { type: String, required: true },
    password: String,
})

const CourseSchema = new mongoose.Schema({
    courseName: String,
    iconUrl: String,
    description: String,
    creatorId: { type: mongoose.Schema.ObjectId, ref: 'Creator' },
    price: Number
})

const VideoSchema = new mongoose.Schema({
    title: String,
    ranking: Number,
    courseId: { type: mongoose.Schema.ObjectId, ref: 'Course'},
    kid: String,
    s3_path: String,
    key_path: String,
    playlistUrl: String,
    keyUrl: String
})

const KeySchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.ObjectId, ref: 'Video' },
    key: String,
})

const PurchasedSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
    courseId: { type: mongoose.Schema.ObjectId, ref: 'Course' }
})

const userModel = mongoose.model("User", userSchema);
const creatorModel = mongoose.model("Creator", creatorSchema);
const courseModel = mongoose.model("Course", CourseSchema);
const videoModel = mongoose.model("Video", VideoSchema);
const keyModel = mongoose.model("Key", KeySchema);
const purchasedModel = mongoose.model("Purchase", PurchasedSchema);

module.exports = { userModel, creatorModel, courseModel, videoModel, keyModel, purchasedModel}