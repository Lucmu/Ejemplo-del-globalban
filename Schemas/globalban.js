const { Schema, Model } = require("mongoose")

const globalban = new Schema({
    userId: {
        type: String,
        required: true
    },
    baneado: {
        type: Boolean,
        required: false,
        default: false
    },
    razon: {
        type: String,
        required: false
    },
    imagen: {
        type: String,
        required: false
    }
})

module.exports = new Model("globalban", globalban)