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

function formatDate(d) {
    var month = padLeft(d.getMonth() + 1, 2);
    var date = padLeft(d.getDate(), 2);
    var hours = padLeft(d.getHours(), 2);
    var minutes = padLeft(d.getMinutes(), 2);
    var seconds = padLeft(d.getSeconds(), 2);
    return `${d.getFullYear()}/${month}/${date} ${hours}:${minutes}:${seconds}`;
}

$(document).ready(function() {
    var socket, chatApp;
    var currentUser;
    var prevDate = new Date();
    prevDate.setFullYear(2016);

    function initChat(user) {
        if (user.name.length === 0 || user.avatar.length === 0) {
            return;
        }
        socket = io.connect();
        chatApp = new Chat(socket, user);
        currentUser = user;
        socket.emit('initJoin', user);
        socket.on('initJoinResponse', function(result) {
            if (result.success) {
                $('#mask').hide();
                $('#send-message').focus();
                $('#username').text(user.name);
            } else {
                alert(result.message);
            }
        })
        socket.on('nameResult', function(result) {
            var message;
            if (result.success) {
                currentUser.name = result.name;
                message = '您当前的用户名为：' + result.name;
                $('#username').text(result.name);
            } else {
                message = result.message;
            }
            appendMessage('system', currentUser, message);
        });

        socket.on('joinResult', function(result) {
            $('#roomname').text(result.room);
            appendMessage('system', currentUser, '您加入了聊天室');
        });

        socket.on('message', function(result) {
            appendMessage(result.type, result.user, result.message);
        });

        socket.on('onlineCount', function(result) {
            $('#online-count').text(result.onlineCount);
        });
    }

    function processUserInput(chatApp, socket) {
        var message = $('#send-message').val();
        processSysCommand(chatApp, socket, message);
    }

    // "send", "receive", "system"
    function appendMessage(type, user, message) {
        var curDate = new Date();
        var msInterval = curDate.getTime() - prevDate.getTime();
        if (msInterval > 60 * 1000) {
            prevDate = curDate;
            $('#messages').append($('<div class="msg date-msg"></div>').text(formatDate(curDate)));
        }

        if (type === 'send') {
            var html = ejs.render($('#right-message-template').html(), {
                name: user.name,
                avatar: user.avatar,
                content: message
            });
            $('#messages').append(html);
        } else if (type === 'receive') {
            var html = ejs.render($('#left-message-template').html(), {
                name: user.name,
                avatar: user.avatar,
                content: message
            });
            $('#messages').append(html);
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
                appendMessage('system', currentUser, systemMessage);
            }
        } else {
            chatApp.sendMessage($('#roomname').text(), message);
            appendMessage('send', currentUser, message);
        }
        $('#send-message').val('');
    }

    // 发送消息
    $('#send-form').submit(function() {
        processUserInput(chatApp, socket);
        $('#send-message').focus();
        return false;
    });

    /////////////////用户名和头像初始化///////////////
    function getInitUser() {
        let user = {
            avatar: '/img/1.png',
            name: $('#input-name').val()
        };
        $('.avatar-img').each(function() {
            if ($(this).hasClass('selected')) {
                user.avatar = $(this).attr('src');
                return false;
            }
        })
        return user;
    }
    $('#input-name').bind('keydown', function(event) {
        if (event.keyCode != '13') {
            return;
        }
        initChat(getInitUser());
    });
    $('#go').on('click', function() {
        initChat(getInitUser());
    });

    // 头像选择
    $('.avatar-img').on('click', function() {
        $('.avatar-img').each(function() {
            $(this).css('border', '');
            $(this).removeClass('selected');
        })
        $(this).css('border', '2px solid #F0DB4F');
        $(this).addClass('selected');
    });

    $('#input-name').focus();
    ////////////////////////////////////////////////////

    // 修改用户名
    $('ul.command-list').on('click', "#modify-username", function() {
        var newName = prompt('请输入新的用户名');
        if (newName != null) {
            processSysCommand(chatApp, socket, `/nick ${newName}`);
        }
        $('#send-message').focus();
    });
});
