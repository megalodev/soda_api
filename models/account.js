import mongoose from 'mongoose'

const account = mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    phone_num: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, required: true, default: false },
    register_time: { type: Date, default: Date.now }
})

const Account = mongoose.model('Account', account)

export default { Account }