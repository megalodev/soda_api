import { func } from 'joi'
import mongoose, { Schema } from 'mongoose'

const Account = mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    phone_num: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    is_active: { type: Boolean, required: true, default: false },
    register_time: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Account', Account)