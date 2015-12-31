/**
 * Created by jiawei.tu on 12/31 0031.
 */

function log(msg) {
    if ($('#debuglog').length == 0) {
        $('body').append($('<div id="debuglog"><hr></div>'));
    }
    $('#debuglog').append($('<li>' + msg + '</li>'));
}

function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    if (message[0] == '/') {
        var systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}

var socket = io.connect();
$(document).ready(function() {
   var chatApp = new Chat(socket);

    socket.on('nameResult', function(result) {
        var message;
        if (result.success) {
            message = 'You are now known as ' + result.name + '.';
        } else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function(result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    socket.on('message', function(message) {
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('rooms', function(rooms) {
        $('#room-list').empty();

        for (var i=0; i<rooms.length; i++) {
            $('#room-list').append(divEscapedContentElement(rooms[i]));
        }

        $('#room-list div').click(function () {
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(function() {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();
    $('#send-form').submit(function() {
        processUserInput(chatApp, socket);
        $('#send-message').focus();
        return false;
    });
});