const usersModel = require('../models/users');
const roomsModel = require('../models/rooms');
const messagesModel = require('../models/messages');

// array of user online
let userOnline = new Map();

async function createRoomName(usersId) {
    let name = '';
    for (let id of usersId) {
        let user = await usersModel.findById(id);
        if (user) {
            name += ('|' + user.email);
        }
    }
    return name;
}
async function getUserOnlineMerge(currentUserId) {
    let users = listUserOnline();
    let merge = [];
    for (let item of users) {
        let id = item._id;
        let userEmail = item.email;
        let room = await roomsModel.findOne({
            $or:[{members: [id, currentUserId]},{members: [currentUserId,id]}],
            isGroup: false
        });
        if (!room) {
            //created rooms if not found
            let name =await createRoomName([id, currentUserId]);
            //create here
            room = await roomsModel.create({
                members: [id, currentUserId],
                isGroup: false,
                name
            });
        }
        // get last messages
        let lastMessage = await messagesModel.getMessages(room.id, 1);
        let mess = undefined;
        if (lastMessage[0]) {
            mess = lastMessage[0].content
        }
        let unRead =await messagesModel.getUnreads(room._id);
        merge.push({
            name: userEmail,
            _id: room._id,
            messages: mess,
            unread:unRead.length
        });
    }
    return merge;
}
function isInRoom(roomId, roomsId) {
    for (let i = 0; i < roomsId.length; i++) {
        let item = roomsId[i];
        if (roomId != item) {
            return true;
        }
    }
    return false;
}


function setUserOnline(user, socketId) {
    let tmp  = JSON.stringify(user);
    if (!userOnline.has(tmp)) {
        userOnline.set(tmp, new Set())
    }
    userOnline.get(tmp).add(socketId);
}

function removeUserOnline(user, socketId) {
    let tmp  = JSON.stringify(user);
    userOnline.get(tmp).delete(socketId);
    if(userOnline.get(tmp).size===0){
        userOnline.delete(tmp);
    }
}

function listUserOnline() {
    let data = [...userOnline.keys()];
    data = data.map((item)=>JSON.parse(item));
    return data;
}
function getNameofListUserOnline(){
    let res = [];
    listUserOnline().forEach((user)=>{
        res.push(user.email)
    });
    return res;
}
function updateListUser(){

}
module.exports = {getUserOnlineMerge,isInRoom,setUserOnline,removeUserOnline,getNameofListUserOnline};