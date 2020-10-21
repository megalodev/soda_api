import mongoose, { Schema } from 'mongoose'

const AccessToken = mongoose.Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account' },
    token: { type: String, required: true },
    expire: { type: Date, required: true }
})

module.exports = mongoose.model('AccessToken', AccessToken)