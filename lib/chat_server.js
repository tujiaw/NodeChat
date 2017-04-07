/**
 * Created by jiawei.tu on 12/31 0031.
 */
var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var currentRoom = {};
var namesUsed = [];

Array.prototype.unique = function() {
    var result = [];
    for (var i=0; i<this.length; i++) {
        if (result.indexOf(this[i]) == -1) {
            result.push(this[i]);
        }
    }
    return result;
};

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function(socket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket, 'Lobby');
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms', function() {
            //socket.emit('rooms', io.sockets.manager.rooms);
            var allRooms = [];
            for (var id in currentRoom) {
                allRooms.push(currentRoom[id]);
            }
            socket.emit('rooms', allRooms.unique());
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {success: true, name: name});
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + ' 加入了 ' + room + '聊天室.'
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
            socket.broadcast.to(currentRoom[socket.io]).emit('message', {
                text: preName + ' is now known as ' + name + '.'
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
        console.log('on message');
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        console.log('on join');
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        console.log('on disconnect');
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}