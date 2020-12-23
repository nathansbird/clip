const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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

app.use('/static/assets', express.static(__dirname + '/src/assets'));

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

        object.x2 = Math.abs(object.x - object.x2) > 160 ? null : object.x2;
        object.y2 = Math.abs(object.y - object.y2) > 160 ? null : object.y2;
        object.x = Math.abs(object.x - object.x2) > 160 ? null : object.x;
        object.y = Math.abs(object.y - object.y2) > 160 ? null : object.y;

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

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on port:3000');
});