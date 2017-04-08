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
    return $('<div class="msg show-send-msg"></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div class="msg sys-msg"></div>').html(message);
}

function divRoomListItemElement(message) {
    return $('<a href="#" class="list-group-item"></a>').text(message);
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    processSysCommand(chatApp, socket, message);
}

function processSysCommand(chatApp, socket, message) {
    if (message.length == 0) {
        return;
    }
    if (message[0] == '/') {
        var systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($('#roomname').text(), message);
        var sendMsg = $('#username').text() + '：' + message;
        $('#messages').append(divEscapedContentElement(sendMsg));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}

var socket = io.connect();
var commandList = [];
$(document).ready(function() {
   var chatApp = new Chat(socket);

    socket.on('nameResult', function(result) {
        var message;
        if (result.success) {
            message = '您当前的用户名为：' + result.name + '.';
        } else {
            message = result.message;
        }
        $('#username').text(result.name);
        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function(result) {
        $('#roomname').text(result.room);
        $('#messages').append(divSystemContentElement(`您加入了聊天室：${result.room}`));
    });

    socket.on('message', function(message) {
        var newElement = $('<div class="msg show-received-msg"></div>').text(message.text);
        $('#messages').append(newElement);
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    socket.on('onlineCount', function(result) {
        $('#online-count').text(result.onlineCount);
    })

    // setInterval(function() {
    //     socket.emit('rooms');
    // }, 1000);

    $('#send-message').focus();
    $('#send-form').submit(function() {
        processUserInput(chatApp, socket);
        $('#send-message').focus();
        return false;
    });

    $('ul.command-list').on('click', "#modify-username", function() {
        var newName = prompt('请输入新的用户名');
        if (newName != null) {
            processSysCommand(chatApp, socket, `/nick ${newName}`);
        }
        $('#send-message').focus();
    })
});