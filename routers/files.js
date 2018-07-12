const route = require('express').Router();
const multer = require('multer');
const messagesModel = require('../models/messages');
const roomsModel = require('../models/rooms');
const Libs = require('../Libs');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + Date.now())
    }
})
let upload = multer({
    storage,
    limits: {
        fileSize: 1000000
    }
});
route.post('/', upload.single('file'), async (req, res) => {
    let {
        room
    } = req.body;
    let file = req.file;
    if (!room) {
        res.status(400).end();
    } else {
        let r = await roomsModel.findById(room);
        let lst_room = await roomsModel.getRoomsId(req.user._id);
        if(Libs.isInRoom(r._id,lst_room)){
            await messagesModel.create({
                type:'file',
                file,
                room:r._id,
                sender:req.user._id,
            });
            res.status(200).send({
                filetype:file.mimetype,
                name:file.originalname
            });
        } else{
            res.status(400).end();
        }
    }
});
route.get('/',async(req,res)=>{
    let name = req.query.name;
    let room = req.query.room;
    if(name&&room){
        let r = await roomsModel.findById(room);
        let lst_room = await roomsModel.getRoomsId(req.user._id);
        if(Libs.isInRoom(r._id,lst_room)){
            let msg = await messagesModel.findOne({"file.originalname":name});
            let link = __dirname+`/../uploads/${msg.file.filename}`;
            if(fs.existsSync(link)){
                var mimetype = mime.lookup(link);
                res.setHeader('Content-disposition', 'attachment; filename=' + name);
                res.setHeader('Content-type', mimetype);
                fs.createReadStream(__dirname+`/../uploads/${msg.file.filename}`).pipe(res);
            } else {
                res.status(404).end();
            }
        } else {
            res.status(400).end();
        }
    } else {
        res.status(400).end();
    }

});
module.exports = route;