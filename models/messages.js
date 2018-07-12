const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

let schema = new mongoose.Schema({
    content: {
        type: String,
        es_indexed: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'rooms',
        required: true,
        es_indexed: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: 'text'
    },
    file: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});
schema.plugin(mongoosastic, {
    hydrate: true,
    hydrateWithESResults: true,
    hydrateOptions: {
        select: 'sender content room'
    },
});
let messages = mongoose.model('messages', schema);


messages.getUnreads = async function (roomId) {
    return await messages.find({
        room: roomId,
        isRead: false
    });
};

messages.updateReaded = async function (roomId) {
    return await messages.update({
        room: roomId,
        isRead: false
    }, {
        $set: {
            isRead: true
        }
    }, {
        multi: true
    });
};

messages.getMessages = async function (roomId, number, sort = '-createdAt',from =0) {
    return await messages.find({
            room: roomId
        })
        .skip(from)
        .limit(number || 10)
        .sort(sort)
        .populate('sender');
};
messages.getMessagesByIds = async function (Ids, number, roomsModel) {
    try {
        let room = await roomsModel.findOne({
            members: {
                $all: [...Ids]
            },
            isGroup: false
        });
        if (!room) {
            throw new Error('room not found');
        }
        return await messages.getMessages(room._id);
    } catch (err) {
        throw err;
    }
};

messages.findMessages = function (text, roomsId, from, size) {
    return new Promise((resolve, reject) => {
        // set up room list
        let data = [];
        if (Array.isArray(roomsId)) {
            data = roomsId.map((item) => {
                return {
                    "term": {
                        "room": {
                            "value": item
                        }
                    }
                }
            });
        }
        // build query
        let value = text ? `*${text}*` : '*';
        let query = {
            from: from || 0,
            size: size || 100,
            query: {
                "bool": {
                    "must": [{
                            "wildcard": {
                                "content": {
                                    "value": value
                                }
                            }
                        },
                        {
                            "bool": {
                                "should": [
                                    ...data
                                ]
                            }
                        }
                    ]
                }
            }
        };
        return messages.esSearch(query, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

module.exports = messages;