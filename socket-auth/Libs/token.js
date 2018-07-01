const jsonwebtoken = require('jsonwebtoken');
const conf = require('../../config');
module.exports.createToken = function(data){
    return new Promise((res,rej)=>{
        jsonwebtoken.sign(data,conf.secretKey,{expiresIn:conf.expiresIn},(err,token)=>{
            if(err){
                rej(err);
            }
            res(token);
        })
    })
}
module.exports.vertifyToken = function(token){
    return new Promise((resolve,reject)=>{
        jsonwebtoken.verify(token,conf.secretKey,(err,payload)=>{
            if(err){
                reject(err);
            }
            resolve(payload);
        })
    })
}