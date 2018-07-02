const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
//
const usersModel = require('./models/users');
const roomsModel = require('./models/rooms');
const messagesModel = require('./models/messages');
//
const authSocket = require('./socket-auth');
//
const conf = require('./config');
const {
    getUserOnlineMerge,
    isInRoom,
    setUserOnline,
    removeUserOnline,
    getNameofListUserOnline
} = require('./Libs/index');
//
const app = express();
//
const auth = new authSocket(roomsModel, usersModel);
//
mongoose.connect(conf.mongodb, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('mongodb started');
});
//app conf 
app.use(cors());
//
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cookie: true
});


io.use(auth.middleware(async (socket, user,next) => {
    let rooms =[];
    let mg = [];
    if (user) {
        let  us =usersModel.findOne({_id:user._id,email:user.email});
        if(!us){
            next('not found user');
        } else {
            next();
        }
        //get rooms
        rooms = await roomsModel.getRooms(user._id);
        //join socket to its rooms
        socket.join(rooms.roomsId);
        setUserOnline(user, socket.id);
        mg = await getUserOnlineMerge(user._id);
        setInterval(async()=>{
            let updateUserOnline =await getUserOnlineMerge(user._id)
            socket.emit('checkUser',updateUserOnline);
        },30000);
    }
    // ignore current user
    return {
        rooms: rooms.roomsName,
        userOnline: mg
    };
}));

io.on('connection', (socket) => {
    console.info('a user is connect', socket.id);
    socket.on('login', async ({
                                  email,
                                  password
                              }, fn) => {
        try {
            let result = await usersModel.auth({
                email,
                password
            });
            socket.isAuthenticated = true;
            if (result.created) {
                await roomsModel.joinToDefaultRoom(result.user._id);
                console.log('added to public room')
            }
            let user = {
                _id: result.user._id,
                email: result.user.email
            };
            socket.user = user;
            //get rooms
            let rooms = await roomsModel.getRooms(user._id);
            //join socket to its rooms
            socket.join(rooms.roomsId);
            // update online
            if (user) {
                setUserOnline(user, socket._id);
            }
            //

            let token = await authSocket.createJwt(user);
            let mergeOnlineUser = await getUserOnlineMerge(user._id);
            fn({
                user,
                token,
                created: result.created,
                rooms: rooms.roomsName,
                userOnline: mergeOnlineUser
            });
        } catch (e) {
            throw e;
        }
    });
    //
    socket.on('disconnect', function (reason) {
        console.log(reason);
        if (socket.user) {
            removeUserOnline(socket.user, socket.id);
        }
    });
    socket.on('message', async ({
                                    roomName,
                                    content
                                }) => {
        try {
            let _id = roomName;
            //update room;
            let updateRooms = await roomsModel.getRoomsId(socket.user._id);
            socket.join(updateRooms);
            //check user in this rooms
            if (_id && isInRoom(_id, updateRooms) && socket.isAuthenticated) {
                //create this message
                await messagesModel.create({
                    content,
                    room: _id,
                    sender: socket.user._id
                });
                io.to(_id).emit('message', {
                    roomName: _id,
                    content,
                    sender: socket.user.email,
                    timestamp: new Date()
                });
            }
        } catch (e) {
            console.log(e.message)
        }
    });
    //
    socket.on('getMessage', async (_id, fn) => {
        try {
            if (!socket.isAuthenticated) {
                throw  new Error('not Authenticated');
            }
            //update room;
            let updateRooms = await roomsModel.getRoomsId(socket.user._id);
            socket.join(updateRooms);
            if (_id && isInRoom(_id, updateRooms)) {
                let messages = await messagesModel.getMessages(_id, null, 'createdAt');
                messages = messages.map((item) => {
                    return {
                        content: item.content,
                        sender: item.sender.email,
                        timestamp: item.createdAt
                    }
                });
                fn(messages);
            } else {
                throw new Error('You not in this room');
            }
        } catch (e) {
            console.log(e);
        }
    });
    socket.on('readedMessage',async (roomId)=>{
        try {
            // because some time when created new room The room is not join automatic .
            // then we should update joined rooms
            let updateRooms = await roomsModel.getRoomsId(socket.user._id);
            socket.join(updateRooms);
            if(socket.isAuthenticated&&roomId&&isInRoom(roomId, updateRooms)){
                await messagesModel.updateReaded(roomId);
            } else {
                throw  new Error('not Authenticated')
            }
        } catch (e) {
            console.log(e.message);
        }
    });
    socket.on('call',async (roomId)=>{
       try {
           // because some time when created new room The room is not join automatic .
           // then we should update joined rooms
           let updateRooms = await roomsModel.getRoomsId(socket.user._id);
           socket.join(updateRooms);
           if(socket.isAuthenticated&&roomId&&isInRoom(roomId, updateRooms)){
               console.log(roomId)
               io.to(roomId).emit('receiveCall',{...socket.user,roomId});
           } else {
               throw  new Error('not Authenticated')
           }
       } catch (e) {
           console.log(e.message);
       }
    });
});


//
server.listen(process.env.PORT || 4000, () => {
    console.info('server is running !!');
});