const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    useremail: {
        type: String,
    },
    phonenumber: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        default: "Pending",
    },
    veri_code: {
        type: String,
    }
});

module.exports = User = mongoose.model('user', UserSchema);