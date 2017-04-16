/**
 * Created by jiawei.tu on 12/31 0031.
 */
var socketio = require('socket.io');

var io;
var guestNumber = 1;
var users = {}; 
//  {
//     id: {
//         name: name,
//         avatar: avatar
//     }
// }
var namesUsed = [];
const DEFAULT_CHAT_ROOM = '聊天室';

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function(socket) {
        handleClientConnection(socket);
        handleClientDisconnection(socket, users, namesUsed);
    });
};

function joinRoom(socket, room) {
    socket.join(room);
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        type: 'system',
        user: users[socket.id],
        message: `${users[socket.id].name}加入了${room}`
    });
}

function handleNameChangeAttempts(socket, users, namesUsed) {
    socket.on('nameAttempt', function(name) {
        console.log('on nameAttempt');
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        } else if (namesUsed.indexOf(name) == -1) {
            var preUser = users[socket.id];
            var preNameIndex = namesUsed.indexOf(preUser.name);
            namesUsed.push(name);
            users[socket.id].name = name;
            delete namesUsed[preNameIndex];
            socket.emit('nameResult', {
                success: true,
                name: name
            });
            socket.broadcast.to(DEFAULT_CHAT_ROOM).emit('message', {
                type: 'system',
                user: users[socket.id],
                message: `[${preUser.name}]改名为[${name}]`
            });
        } else {
            socket.emit('nameResult', {
                success: false,
                message: '这个名字已经被占用了！'
            });
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            type: 'receive',
            user: users[socket.id],
            message: message.text
        });
    });
}

function handleClientConnection(socket) {
    socket.on('initJoin', function(user) {
        if (namesUsed.indexOf(user.name) == -1) {
            users[socket.id] = user;
            namesUsed.push(user.name);
            joinRoom(socket, DEFAULT_CHAT_ROOM);
            handleMessageBroadcasting(socket);
            handleNameChangeAttempts(socket, users, namesUsed);
            socket.emit('initJoinResponse', {
                success: true
            });
            broadcastOnlineCount(socket);
        } else {
            socket.emit('initJoinResponse', {
                success: false,
                message: `"${user.name}"名字已经被占用了！`
            });
        }
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        console.log('on disconnect');
        if (!users[socket.id]) {
            return;
        }
        var nameIndex = namesUsed.indexOf(users[socket.id].name);
        delete namesUsed[nameIndex];
        delete users[socket.id];
        broadcastOnlineCount(socket);
    });
}

function broadcastOnlineCount(socket) {
    let onlineCount = 0;
    for (let i = 0; i < namesUsed.length; i++) {
        if (namesUsed[i] != undefined) {
            ++onlineCount;
        }
    }
    io.emit('onlineCount', { onlineCount: onlineCount});
}
