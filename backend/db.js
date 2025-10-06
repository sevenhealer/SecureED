const mongoose = require('mongoose')

mongoose.connect('')
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
    creatorId: { type: mongoose.Schema.ObjectId, ref: 'Creator' },
    price: Number
})

const PurchasedSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
    courseId: { type: mongoose.Schema.ObjectId, ref: 'Course' }
})

const userModel = mongoose.model("User", userSchema);
const creatorModel = mongoose.model("Creator", creatorSchema);
const courseModel = mongoose.model("Course", CourseSchema);
const purchasedModel = mongoose.model("Purchase", PurchasedSchema);

module.exports = { userModel, creatorModel, courseModel, purchasedModel}