const mongoose = require('mongoose');
const messagesModel = require('./messages');
let schema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    members: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }]
    },
    isGroup: {
        type: Boolean,
        default: false
    }
}, {
    timestamp: true
});

let rooms = mongoose.model('rooms', schema);

rooms.joinToDefaultRoom = (userId) => {
    return rooms.findOneAndUpdate({
        name: 'Authenticated'
    }, {
        $push: {
            members: userId
        }
    })
};

rooms.getRooms = async (memberId) => {
    try {
        let rs = await rooms.find({
            members: {
                $in: [memberId]
            }
        });
        //
        let roomsName = [],
            roomsId = [];
        for (let item of rs) {
            let {
                _id,
                name,
                isGroup
            } = item;
            roomsId.push(_id);
            if (isGroup) {
                let lastMessage = '';
                let mgms = await messagesModel.getMessages(_id, 1);
                let unRead =await messagesModel.getUnreads(_id);
                if (mgms && mgms.length > 0) {
                    mgms = mgms[0];
                    lastMessage = mgms.content;
                }
                roomsName.push({
                    name,
                    messages: lastMessage,
                    _id,
                    unread:unRead.length
                });
            }
        }
        return {
            roomsName,
            roomsId
        };
    } catch (err) {
        throw err;
    }
};
rooms.getRoomsId = async (memberId) => {
    try {
        let rs = await rooms.find({
            members: {
                $in: [memberId]
            }
        });
        let roomsId = [];
        for (let item of rs) {
            roomsId.push(item._id);
        }
        return roomsId;
    } catch (error) {
        throw error;
    }
};
module.exports = rooms;