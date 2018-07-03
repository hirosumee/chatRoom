const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    room:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'rooms',
        required:true
    },
    timeStart:{
        type:Date,
        default:Date.now()
    },
    timeEnd:{
        type:Date,
        default:Date.now()
    },
    isEnd:{
        type:Boolean,
        default:false
    },
    option:{
        type:String,
        default:'video'
    }
}, {timestamp: true});

let calls = mongoose.model('calls',schema);

module.exports = calls;
