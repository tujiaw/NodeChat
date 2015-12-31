/**
 * Created by jiawei.tu on 12/31 0031.
 */

var Chat = function(socket) {
    this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
    var message = {
        room: room,
        text: text
    };
    this.socket.emit('message', message);
};

Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join', {
        newRoom: room
    });
};

Chat.prototype.processCommand = function(command) {
    var words = command.split(' ');
    var command = words[0].substring(1, words[0].length).toLowerCase();
    var message = '';
    switch (command) {
        case 'join':
            words.shift();
            var room = words.join(' ');
            if (room.trim().length === 0) {
                message = 'join room is empty!';
            } else {
                this.changeRoom(room);
            }
            break;
        case 'nick':
            words.shift();
            var name = words.join(' ');
            if (name.trim().length === 0) {
                message = 'nick name is empty!';
            } else {
                this.socket.emit('nameAttempt', name);
            }
            break;
        default:
            message = 'Unrecognized command.';
            break;
    }
    return message;
}