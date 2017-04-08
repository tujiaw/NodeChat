/**
 * Created by jiawei.tu on 12/31 0031.
 */

function log(msg) {
    if ($('#debuglog').length == 0) {
        $('body').append($('<div id="debuglog"><hr></div>'));
    }
    $('#debuglog').append($('<li>' + msg + '</li>'));
}

function padLeft(num, n) {
    var y = '00000000000000' + num;
    return y.substr(y.length - n);
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    processSysCommand(chatApp, socket, message);
}

function formatDate(d) {
    var month = padLeft(d.getMonth() + 1, 2);
    var date = padLeft(d.getDate(), 2);
    var hours = padLeft(d.getHours(), 2);
    var minutes = padLeft(d.getMinutes(), 2);
    var seconds = padLeft(d.getSeconds(), 2);
    return `${d.getFullYear()}/${month}/${date} ${hours}:${minutes}:${seconds}`;
}

var prevDate = new Date();
prevDate.setFullYear(2016);
// "send", "receive", "system"
function appendMessage(message, type) {
    var curDate = new Date();
    var msInterval = curDate.getTime() - prevDate.getTime();
    if (msInterval > 60 * 1000) {
        prevDate = curDate;
        $('#messages').append($('<div class="msg date-msg"></div>').text(formatDate(curDate)));
    }

    if (type === 'send') {
        var sendMsg = message + '：[' + $('#username').text() + ']';
        $('#messages').append($('<div class="msg show-send-msg"></div>').text(sendMsg));
    } else if (type === 'receive') {
        var strList = message.split('：');
        if (strList.length > 1) {
            strList[0] = `[${strList[0]}]`;
        }
        $('#messages').append($('<div class="msg show-receive-msg"></div>').text(strList.join('：')));
    } else if (type === 'system') {
        $('#messages').append($('<div class="msg sys-msg"></div>').text(message));
    }
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
}

function processSysCommand(chatApp, socket, message) {
    if (message.length == 0) {
        return;
    }
    if (message[0] == '/') {
        var systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            appendMessage(systemMessage, 'system');
        }
    } else {
        chatApp.sendMessage($('#roomname').text(), message);
        appendMessage(message, 'send');
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
            message = '您当前的用户名为：' + result.name;
        } else {
            message = result.message;
        }
        $('#username').text(result.name);
        appendMessage(message, 'system');
    });

    socket.on('joinResult', function(result) {
        $('#roomname').text(result.room);
        appendMessage('您加入了聊天室', 'system');
    });

    socket.on('message', function(message) {
        appendMessage(message.text, message.type);
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