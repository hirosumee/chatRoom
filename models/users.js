const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const bcrypt = require('bcrypt');

var schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        maxlength: 100
    },
    password: {
        type: String,
        required: true,
        maxlength: 100
    },
    position: {
        type: Number,
        default: 4
    },
    isOnline:{
        type:Boolean,
        default:true
    }
}, {
    timestamps: true
});
schema.plugin(findOrCreate);
var users = mongoose.model('users', schema);

users.auth = async ({email,password})=>{
    try{
        let result = await users.findOne({email});
        //check result != undefined
        if(result){
            try{
                let checkResult =await bcrypt.compare(password,result.password);
                if(checkResult){
                    //login ok
                    return {user:result,created:false};
                } else {
                    //password failed
                    
                    throw new Error('password failed');
                }
            } catch(e){
                throw e;
            }
        } else {
            // create a user
            let hashedPassword = await  bcrypt.hash(password,5);
            let userCreated = await users.create({email,password:hashedPassword});
            return {user:userCreated,created:true};
        }
    } catch(e){
        throw e;
    }
};

users.setAllOffline = async()=>{
    return await users.update({},{$set:{isOnline:false}},{ multi: true });
};
users.setAUserOffline = async (userId)=>{
    return users.update({_id:userId},{$set:{isOnline:false}});
};
users.setAUserOnline =async (userId)=>{
    return users.update({_id:userId},{$set:{isOnline:true}});
};
module.exports = users;