const express = require('express');
const app = express();
const app2 = express();
const http = require('http').createServer(app);
const http2 = require('http').createServer(app2);
const io = require('socket.io')(http);
const io2 = require('socket.io')(http2);

let socketList = {};
let clippedAmount = 0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/src/index.html');
});

app.get('/index.css', function(req, res){
    res.sendFile(__dirname + '/src/index.css');
});

app.get('/index.js', function(req, res){
    res.sendFile(__dirname + '/src/index.js');
});

app2.get('/', function(req, res){
    res.sendFile(__dirname + '/src/spectator/index.html');
});

app2.get('/index.css', function(req, res){
    res.sendFile(__dirname + '/src/spectator/index.css');
});

app2.get('/index.js', function(req, res){
    res.sendFile(__dirname + '/src/spectator/index.js');
});

app.use('/static/assets', express.static(__dirname + '/src/assets'));
app2.use('/static/assets', express.static(__dirname + '/src/assets'));

let squares = {};
let clipTimes = {};

io.on('connection', function(socket){
    socketList[socket.id] = socket;
    socket.on('disconnect', function(){
        delete socketList[socket.id];
        delete squares[socket.id];
    });
    socket.on('position', function(object){
        if(squares[socket.id] == null){
            squares[socket.id] = {};
        }

        object.x2 = Math.abs(object.x - object.x2) > 200 ? null : object.x2;
        object.y2 = Math.abs(object.y - object.y2) > 200 ? null : object.y2;
        object.x = Math.abs(object.x - object.x2) > 200 ? null : object.x;
        object.y = Math.abs(object.y - object.y2) > 200 ? null : object.y;

        if(object.x2 == null || object.y2 == null){
            killHKR(socket, 'ANTI-CHEAT');
            return;
        }

        squares[socket.id].props = object;
    });
    socket.on('clip', function(){
        if(clipTimes[socket.id] != null && new Date().getTime() - clipTimes[socket.id] < 100){
            killHKR(socket, 'ANTI-SPAM');
            return
        }

        clipTimes[socket.id] = new Date().getTime();
        evaluateClip(socket.id);
    });
    socket.on('reset', function(){
        squares = {};
        clippedAmount = 0;
        io.sockets.emit('cleanup');
    });
});

function killHKR(socket, reason){
    socket.emit('die', reason);
}

let spectator;
io2.on('connection', function(socket){
    spectator = socket;
});

function emitSquares(){
    let relevantLists = {};
    let allList = [];

    for(let key in socketList){
        let newList = [];
        for(let key2 in squares){
            if(key2 != socketList[key].id && !squares[key2].isDead){
                let props = squares[key2].props;
                if(props.upDown == 1){
                    newList.push(props);
                }
            }
        }

        relevantLists[socketList[key].id] = newList;
    }

    for(let key in squares){
        if(!squares[key].isDead){
            allList.push(squares[key].props);
        }
    }

    for(let key in socketList){
        socketList[key].emit('updateSquares', relevantLists[socketList[key].id]);
    }

    if(spectator != null){
        spectator.emit('updateSquares', allList);
    }
}

function evaluateClip(id){
    let clipper = squares[id];

    for(let key in squares){
        if(key != id){
            if(isInside(clipper.props, squares[key].props) && !squares[key].isDead){
                socketList[key].emit('die', squares[id].props.name);
                socketList[id].emit('kill');
                squares[key].isDead = true;
                clippedAmount++;
                if(squaresAlive() == 1){
                    socketList[id].emit('win');
                    if(spectator != null){
                        spectator.emit('winner', squares[id].props.name);
                    }
                }
            }
        }
    }
}

function squaresAlive(){
    let total = 0;
    for(let key in squares){
        if(!squares[key].isDead){
            total++;
        }
    }
    return total;
}

function isInside(clipper, target){
    let inside = true;
    if(!(clipper.x < clipper.x2 && (clipper.x < target.x2 && clipper.x2 > target.x2)) && !(clipper.x > clipper.x2 && (clipper.x2 < target.x2 && clipper.x > target.x2))){
        inside = false;
    }
    if(!(clipper.y < clipper.y2 && (clipper.y < target.y2 && clipper.y2 > target.y2)) && !(clipper.y > clipper.y2 && (clipper.y2 < target.y2 && clipper.y > target.y2))){
        inside = false;
    }

    return inside;
}

setInterval(emitSquares, 1000/20);

http.listen(80, function(){
  console.log('listening on *:80');
});

http2.listen(4000, function(){
    console.log('listening on *:4000');
});