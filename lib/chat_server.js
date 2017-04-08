/**
 * Created by jiawei.tu on 12/31 0031.
 */
var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
const DEFAULT_CHAT_ROOM = '聊天室';

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function(socket) {
        handleClientConnection(socket);
        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

function joinRoom(socket, room) {
    socket.join(room);
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        type: 'system',
        text: `${nickNames[socket.id]}加入了${room}`
    });
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name) {
        console.log('on nameAttempt');
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        } else if (namesUsed.indexOf(name) == -1) {
            var preName = nickNames[socket.id];
            var preNameIndex = namesUsed.indexOf(preName);
            namesUsed.push(name);
            nickNames[socket.id] = name;
            delete namesUsed[preNameIndex];
            socket.emit('nameResult', {
                success: true,
                name: name
            });
            socket.broadcast.to(DEFAULT_CHAT_ROOM).emit('message', {
                type: 'system',
                text: `[${preName}]改名为[${name}]`
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
            text: `${nickNames[socket.id]}：${message.text}`
        });
    });
}

function handleClientConnection(socket) {
    socket.on('initJoin', function(name) {
        if (namesUsed.indexOf(name) == -1) {
            nickNames[socket.id] = name;
            namesUsed.push(name);
            joinRoom(socket, DEFAULT_CHAT_ROOM);
            handleMessageBroadcasting(socket);
            handleNameChangeAttempts(socket, nickNames, namesUsed);
            socket.emit('initJoinResponse', {
                success: true
            });
            broadcastOnlineCount(socket);
        } else {
            socket.emit('initJoinResponse', {
                success: false,
                message: `"${name}"名字已经被占用了！`
            });
        }
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        console.log('on disconnect');
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
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
