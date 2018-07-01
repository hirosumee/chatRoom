const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    content: {
        type: String
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'rooms',
        required: true
    },
    isRead:{
        type:Boolean,
        default:false
    }
}, {
    timestamps: true
});
let messages = mongoose.model('messages', schema);

messages.getMessages = async function (roomId, number,sort='-createdAt') {
    return await messages.find({
        room: roomId
    })
        .limit(number || 1000000)
        .sort(sort)
        .populate('sender');
};
messages.getMessagesByIds = async function (Ids, number,roomsModel) {
    try {
        let room = await roomsModel.findOne({
            members: {
                $all: [...Ids]
            },
            isGroup:false
        });
        if(!room){
            throw new Error('room not found');
        }
        return await messages.getMessages(room._id);
    } catch (err) {
        throw err;
    }
};
messages.getUnreads = async function(roomId){
    return await messages.find({room: roomId, isRead: false});
};
messages.updateReaded = async function(roomId){
    return await messages.update({room:roomId,isRead:false},{$set:{isRead:true}});
};
module.exports = messages;