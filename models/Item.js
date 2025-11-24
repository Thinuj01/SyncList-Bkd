const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    itemName:{
        type: String,
        required: true
    },
    isClaimed:{
        type: Boolean,
        default: false
    },
    claimedBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    list:{
        type: Schema.Types.ObjectId,
        ref: 'List'
    }
},{timestamps: true})

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
