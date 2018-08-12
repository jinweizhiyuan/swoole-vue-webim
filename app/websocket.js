/**
 * the format of json
 * CONNECT
 * {
 *  status: 200,
 *  type: 'connect',
 *  data: {
 *    id: 0,
 *    avatar: '',
 *    nickname: ''
 *  }
 * }
 * DISCONNECT
 * {
 *  status: 200,
 *  type: 'disconnect',
 *  data: {
 *    id: 0
 *  }
 * }
 * MESSAGE
 * {
 *  status: 200,
 *  type: 'message',
 *  data: {
 *    from: 0,
 *    to: 0,
 *    msg: ''
 *  }
 * }
 * INIT
 * {
 *  status: 200,
 *  type: 'init',
 *  data: {
 * 
 *  }
 * }
 */

const net = require('net');
const crypto = require('crypto');
const extend = require('extend');
const { Console } = require('console');
const WS = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const DEBUG = false;

const logger = new Console(process.stdout, process.stderr);
var _log = logger.log;
logger.log = function(msg) {
    if (DEBUG) {
        if (typeof(msg) == "string") {
            _log(`===${msg}===`);
        } else {
            // _log('===logger start===');
            _log(msg);
            // _log('===logger end===')
        }
    }
}

const CONNECT_TYPE = 'connect';
const DISCONNECT_TYPE = 'disconnect';
const MESSAGE_TYPE = 'message';
const INIT_SELF_TYPE = 'self_init';
const INIT_OTHER_TYPE = 'other_init';
const COUNT_TYPE = 'count';
var avatars = [
    'http://e.hiphotos.baidu.com/image/h%3D200/sign=08f4485d56df8db1a32e7b643922dddb/1ad5ad6eddc451dad55f452ebefd5266d116324d.jpg',
    'http://tva3.sinaimg.cn/crop.0.0.746.746.50/a157f83bjw8f5rr5twb5aj20kq0kqmy4.jpg',
    'http://www.ld12.com/upimg358/allimg/c150627/14353W345a130-Q2B.jpg',
    'http://www.qq1234.org/uploads/allimg/150121/3_150121144650_12.jpg',
    'http://tva1.sinaimg.cn/crop.4.4.201.201.50/9cae7fd3jw8f73p4sxfnnj205q05qweq.jpg',
    'http://tva1.sinaimg.cn/crop.0.0.749.749.50/ac593e95jw8f90ixlhjdtj20ku0kt0te.jpg',
    'http://tva4.sinaimg.cn/crop.0.0.674.674.50/66f802f9jw8ehttivp5uwj20iq0iqdh3.jpg',
    'http://tva4.sinaimg.cn/crop.0.0.1242.1242.50/6687272ejw8f90yx5n1wxj20yi0yigqp.jpg',
    'http://tva2.sinaimg.cn/crop.0.0.996.996.50/6c351711jw8f75bqc32hsj20ro0roac4.jpg',
    'http://tva2.sinaimg.cn/crop.0.0.180.180.50/6aba55c9jw1e8qgp5bmzyj2050050aa8.jpg'
];
var nicknames = [
    '沉淀', '暖寄归人', '厌世症i', '难免心酸°', '過客。', '昔日餘光。', '独特', '有爱就有恨', '共度余生', '忆七年', '单人旅行', '何日许我红装', '醉落夕风'
];

var table = new Map();
var clients = new Map();

var server = net.Server(function(socket) {
    logger.log('connectionListener');
    // logger.log(socket);
    socket.on('connect', function() {
        logger.log('socket connect');
        // logger.log(arguments);
    });
    // socket.setEncoding('utf-8');
    socket.on('close', function() {
        logger.log('socket close');
        // let msg = buildMsg({
        //     id: KEY,
        //     'count': table.size
        // }, DISCONNECT_TYPE);
        // task({
        //     'to': [],
        //     'except': [KEY],
        //     'data': msg
        // });
        // logger.log(table);
        // logger.log(KEY);
        
    });

    let KEY;
    let avatar, nickname;
    socket.on('data', function(e) {
        logger.log('socket data');

        if (!KEY) {
            //获取socket KEY
            KEY = e.toString().match(/Sec-WebSocket-Key: (.+)/)[1];
            KEY = crypto.createHash('sha1').update(KEY + WS).digest('base64');
            socket.write('HTTP/1.1 101 Switching Protocols\r\n');
            socket.write('Upgrade: websocket\r\n');
            socket.write('Connection: Upgrade\r\n');
            socket.write('Sec-WebSocket-Accept: ' + KEY + '\r\n');
            // socket.write('Sec-WebSocket-Protocol: chat\r\n');
            socket.write('\r\n');

            clients.set(KEY, socket);

            let _random = Math.floor(Math.random() * avatars.length);
            avatar = avatars[_random];
            nickname = nicknames[_random];

            //init selfs data
            logger.log('init selfs data');
            table.set(KEY, {
                'id': KEY,
                'avatar': avatar,
                'nickname': nickname
            });
            let userMsg = buildMsg({
                'id': KEY,
                'avatar': avatar,
                'nickname': nickname,
                'count': table.size
            }, INIT_SELF_TYPE);
            // socket.write(encodeDataFrame());
            task({
                'to': [KEY],
                'except': [],
                'data': userMsg
            });

            // init others data
            logger.log('init others data');
            let others = [];
            for (let row of table.values()) {
                others.push(row);
            }
            let otherMsg = buildMsg(others, INIT_OTHER_TYPE);
            task({
                'to': [KEY],    
                'except': [],
                'data': otherMsg
            })

            //broadcast a user is online
            logger.log('broadcast a user is online');
            let msg = buildMsg({
                'id': KEY,
                'avatar': avatar,
                'nickname': nickname,
                'count': table.size
            }, CONNECT_TYPE);
            task({
                'to': [],
                'except': [KEY],
                'data': msg
            })
        } else {
            logger.log('receive message');
            // try {
                logger.log('receive message 1');
                let data = decodeDataFrame(e);
                logger.log(data);
                if (data.Opcode == 8) {
                    task({to:[], except:[], data:{}}, {Opcode:8});
                    return;
                }
                let receive = data.PayloadData;
                let msg = buildMsg(JSON.parse(receive), MESSAGE_TYPE);
                msg = {
                    'to': [],
                    'except': [KEY],
                    'data': msg
                };
                if (receive.to && receive.to != 0) {
                    msg.to = [receive.to]
                }
                task(msg);
                logger.log('receive message 2');
            // } catch (e) {
            //     logger.log(e);
            // }
        }
    });

    socket.on('error', function(e) {
        logger.log('socket error');
        logger.log(e);
    });
    socket.on('end', function () {
        logger.log('socket end')
    })

    function task(data, marker) {
        var _marker = extend(true, {FIN: 1, Opcode: 1}, marker),
            out = extend(true, {}, _marker),
            _clients = [];
        
        for (let c of clients.keys()) {
            _clients.push(c);
        }
        // if (Buffer.isBuffer(data.data)) data.data = data.data.toString('utf-8');
        // if (typeof(data.data) != "string") {
            out.PayloadData = JSON.stringify(data.data);
        // } else {
        //     out.PayloadData = data.data;
        // }
        // logger.log(out.PayloadData);
        logger.log(out);
        out = encodeDataFrame(out);

        if (data.to.length > 0) {
            _clients = data.to;
        }
        // logger.log(data);
        // logger.log(clients.size);
        logger.log(_clients);
        
        if (_marker.Opcode == 8) {
            // logger.log('opcode 8')
            clients.delete(KEY);
            let msg = buildMsg({
                id: KEY,
                'count': table.size
            }, DISCONNECT_TYPE);
            task({
                'to': [],
                'except': [KEY],
                'data': msg
            });
            table.delete(KEY);
            // clients.get(KEY).write(out);
        } else {
            _clients && _clients.length && _clients.forEach(function(value, key, map) {
                // logger.log(data.except + '>>>' + value);
                // logger.log(data.except.findIndex(v => v == value));
                if ((data.except.findIndex(v => v == value)) == -1) {
                    // logger.log(value);
                    clients.get(value).write(out);
                }
            });
        }
    }
});

// server.on('connection', function() {
//     logger.log('connection');
// });

// server.on('data', function() {
//     logger.log('data');
// });

server.on('close', function() {
    logger.log('close');
});

server.on('error', function(e) {
    logger.log('error');
    logger.error(e);
})

server.listen(9501, '127.0.0.1', function() {
    // logger.log(arguments);
    logger.log('listen');
});

function buildMsg(data, type, status = 200) {
    return {
        'status': status,
        'type': type,
        'data': data
    };
}


function decodeDataFrame(e) {
    var i = 0,
        j, s, frame = {
            //解析前两个字节的基本数据
            FIN: e[i] >> 7,
            Opcode: e[i++] & 15,
            Mask: e[i] >> 7,
            PayloadLength: e[i++] & 0x7F
        };
    //处理特殊长度126和127
    if (frame.PayloadLength == 126)
        frame.PayloadLength = (e[i++] << 8) + e[i++];
    if (frame.PayloadLength == 127)
        i += 4, //长度一般用四字节的整型，前四个字节通常为长整形留空的
        frame.PayloadLength = (e[i++] << 24) + (e[i++] << 16) + (e[i++] << 8) + e[i++];
    //判断是否使用掩码
    if (frame.Mask) {
        //获取掩码实体
        frame.MaskingKey = [e[i++], e[i++], e[i++], e[i++]];
        //对数据和掩码做异或运算
        for (j = 0, s = []; j < frame.PayloadLength; j++)
            s.push(e[i + j] ^ frame.MaskingKey[j % 4]);
    } else s = e.slice(i, i + frame.PayloadLength); //否则直接使用数据
    //数组转换成缓冲区来使用
    s = new Buffer(s);
    //如果有必要则把缓冲区转换成字符串来使用
    if (frame.Opcode == 1) s = s.toString();
    //设置上数据部分
    frame.PayloadData = s;
    //返回数据帧
    return frame;
};

function encodeDataFrame(e) {
    var s = [],
        o = new Buffer(e.PayloadData),
        l = o.length;
    //输入第一个字节
    s.push((e.FIN << 7) + e.Opcode);
    //输入第二个字节，判断它的长度并放入相应的后续长度消息
    //永远不使用掩码
    if (l < 126) s.push(l);
    else if (l < 0x10000) s.push(126, (l & 0xFF00) >> 8, l & 0xFF);
    else s.push(
        127, 0, 0, 0, 0, //8字节数据，前4字节一般没用留空
        (l & 0xFF000000) >> 24, (l & 0xFF0000) >> 16, (l & 0xFF00) >> 8, l & 0xFF
    );
    //返回头部分和数据部分的合并缓冲区
    return Buffer.concat([new Buffer(s), o]);
};