const jwtToken = require('./Libs/token');
const cookie = require('cookie');
const jsonToken = require('./Libs/token');

class Auth {
    constructor() {
    }

    middleware(fn) {
        // let that = this;
        return async (socket, next) => {
            socket.isAuthenticated = false;
            let temp = socket.handshake.headers.cookie;
            if (temp) {
                if (typeof temp !== 'string') {
                    temp = temp.toString();
                }
                let cookies = cookie.parse(temp);
                let jwt = cookies.jwt;
                if (jwt) {
                    try {
                        let payloads = await jwtToken.vertifyToken(jwt);
                        let user = {
                            _id: payloads._id,
                            email: payloads.email
                        };

                        let options = {};
                        options = await fn(socket, user ,(err)=>{
                            if(err){
                                throw new Error(err);
                            }
                        });
                        socket.isAuthenticated  = true;
                        socket.user = user;
                        //emit event authenticated to user
                        socket.emit('authenticated', {user, ...options});
                    } catch (err) {
                        next();
                    }
                }
            }
            next();
        }
    }

     static async createJwt(user) {
        return  await jsonToken.createToken(user);
    }
}

module.exports = Auth;