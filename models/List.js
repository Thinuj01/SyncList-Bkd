const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listSchema= new Schema({
    listName: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    items: [{
        type: Schema.Types.ObjectId,
        ref: 'Item'
    }]
}, {timestamps: true});

const List = mongoose.model('List', listSchema);
module.exports = List;
