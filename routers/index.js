const route = require('express').Router();
const jsonwebtoken = require('jsonwebtoken');
const config = require('../config');
const usersModel = require('../models/users');
route.use((req,res,next)=>{
    let {jwt} = req.cookies;
    if(jwt){
        jsonwebtoken.verify(jwt,config.secretKey,(err,payload)=>{
            if(err){
                next(err);
            }else{
                usersModel.findById(payload._id,(err,data)=>{
                    req.user = payload;
                    next();
                });
            }
        });
    }else{
        res.sendStatus(401);
        next('not authenticated');
    }
});
route.use('/file',require('./files'));

module.exports = route;