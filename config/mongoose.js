import mongoose from 'mongoose'
require('dotenv').config()

const { ENV, DB_URL, DB_URL_TEST } = process.env

mongoose.Promise = Promise

mongoose.connection.on('error', function (err) {
    console.error(`Database connection error: ${err}`)
    process.exit(1)
})

const DB = ENV === 'test' ? DB_URL_TEST : DB_URL

export function dbconn() {
    mongoose.connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        keepAlive: 1,
        useFindAndModify: false
    }).then(function () { console.log(`Database connected`) })

    return mongoose.connection
}
