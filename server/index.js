const app = require('express')();
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

let squares = {};

io.on('connection', function(socket){
    socketList[socket.id] = socket;
    console.log('a user connected '+Object.keys(socketList).length);
    socket.on('disconnect', function(){
        delete socketList[socket.id];
    });
    socket.on('position', function(object){
        squares[socket.id] = object;
    });
    socket.on('clip', function(){
        evaluateClip(socket.id);
    });
    socket.on('reset', function(){
        squares = {};
        clippedAmount = 0;
        console.log('cleanup');
        io.sockets.emit('cleanup');
    });
});

function emitSquares(){
    let relevantLists = {};

    for(let key in socketList){

        let newList = [];
        for(let key2 in squares){
            if(key2 != socketList[key].id){
                newList.push(squares[key2]);
            }
        }

        relevantLists[socketList[key].id] = newList;
    }

    for(let key in socketList){
        socketList[key].emit('updateSquares', relevantLists[socketList[key].id]);
    }
}

function evaluateClip(id){
    let clipper = squares[id];

    for(let key in squares){
        if(key != id){
            if(isInside(clipper, squares[key])){
                socketList[key].emit('die', Object.keys(socketList).length - clippedAmount);
                clippedAmount++;
                if(Object.keys(socketList).length - clippedAmount == 1){
                    socketList[id].emit('win');
                }
            }
        }
    }
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

http.listen(3000, function(){
  console.log('listening on *:3000');
});