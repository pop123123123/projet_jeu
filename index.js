var express = require('express');
var path = require("path");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

var width = 40;
var height = 40;
var map = [];
for (var x = 0; x < width; x++) {
    var defRow = [];
    for (var y = 0; y < height; y++) {
        defRow.push(-1);
    }
    map.push(defRow);
}

var ALIVE = 0;
var TRAILING = 1;
var DEAD = 2;

var REFRESH_TIME = 400;

var coordinates = [{
    x: -1,
    y: 0
}, {
    x: 1,
    y: 0
}, {
    x: 0,
    y: -1
}, {
    x: 0,
    y: 1
}]

var path = require('path');

var players = {};

var names = ["nominatif", "accusatif", "génitif", "datif", "ablatif", "vocatif"];

// Routing

app.get('/game', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(__dirname + "/view.html");
});

app.get('/jquery', (req, res) => {
    res.setHeader('Content-Type', 'text/js');
    res.sendFile(__dirname + "/jquery-3.1.1.js");
});

app.get('/script', (req, res) => {
    res.setHeader('Content-Type', 'text/js');
    res.sendFile(__dirname + "/script.js");
});

app.get('/new_player', (req, res) => {
    //let name = req.params.username;
    let name = names[0];
    let i = 0;
    while (players.hasOwnProperty(name)) {
        i = Math.floor(Math.random() * names.length);
        name = names[i];
    }
    let player = {
        name: name,
        trail: [],
        position: randomPosition(),
        state: ALIVE,
        countDown: 4,
        color: i,
        direction: 0,
	changes: []
    }
    for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
            replaceColor({
                x: player.position.x + x,
                y: player.position.y + y
            }, player.color);
        }
    }
invalidate({event:0, name:name});
    players[name] = player;
    res.setHeader('Content-Type', 'text/plain');
    res.send({
        player: player,
        players: players,
        map: map
    });
});

app.post('/update', function(req, res) {
    var name = req.body.username;
    var d = parseInt(req.body.direction);
    if (d != -1 && players[name].direction != d) {
        players[name].direction = d;
	invalidate({event:5, name:name, direction:d});
    }
    let result = {
        players: players,
        map: map
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send(result);
    if (Object.prototype.hasOwnProperty.call(players, name)) {
        players[name].changes = [];
    }
});

// Main loop
start();

function start() {
    setTimeout(updatePositions, REFRESH_TIME);
}

function randomPosition() {
    return {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
    };
}

function replaceColor(position, color) {
    if (!isOutOfBounds(position)) {
        map[position.x][position.y] = color;
	invalidate({event: 4, position:position, color: color});
    }
}

function getNewPos(position, direction) {
    switch (direction) {
        case 0:
            return {
                x: position.x,
                y: position.y - 1
            };
        case 1:
            return {
                x: position.x - 1,
                y: position.y
            };
        case 2:
            return {
                x: position.x,
                y: position.y + 1
            };
        case 3:
            return {
                x: position.x + 1,
                y: position.y
            };
        default:
            return position;
    }
}

function isOutOfBounds(position) {
    return position.x < 0 || position.y < 0 || position.x >= width || position.y >= height;
}

function killPlayer(player) {
    player.state = DEAD;
    player.trail = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (map[x][y] == player.color) {
                replaceColor({
                    x: x,
                    y: y
                }, -1);
            }
        }
    }
    invalidate({event: 1, name:player.name});
}

function isColliding(position) {
    for (var playername in players) {
        if (players.hasOwnProperty(playername)) {
            let player = players[playername];
            for (let x = 0; x < player.trail.length; x++) {
                if (position.x == player.trail[x].x && position.y == player.trail[x].y) {
                    return player;
                }
            }
        }
    }
    return -1;
}

function fill(trail, color) {
    for (var i = 0; i < trail.length; i++) {
        replaceColor({x:trail[i].x, y:trail[i].y},color);
    }
    map0 = []
    for (var x = 0; x < width; x++) {
        var defRow = [];
        for (var y = 0; y < height; y++) {
            defRow.push({
                color: map[x][y],
                flag: false
            });
        }
        map0.push(defRow);
    }
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            if (map0[x][y].color != color && !map0[x][y].flag) {
                // test in polygon
                map0[x][y].flag = true;
                pos = [{
                    x: x,
                    y: y
                }];
                let j = 0;
                let outside = false;
                while (j < pos.length) {
                    for (var i = 0; i < coordinates.length; i++) {
                        let c = addPositions(coordinates[i], pos[j]);
                        if (isOutOfBounds(c)) {
                            outside = true;
                        } else if (!map0[c.x][c.y].flag && map0[c.x][c.y].color != color) {
                            map0[c.x][c.y].flag = true;
                            pos.push(c);
                        }
                    }
                    j++;
                }
                if (!outside) {
                    for (var i = 0; i < pos.length; i++) {
                        replaceColor(pos[i], color);
                    }
                }
            }
        }
    }
}

function deFlag(map0) {
    for (var x0 = 0; x0 < width; x0++) {
        for (var y0 = 0; y0 < height; y0++) {
            map0[x0][y0].flag = false;
        }
    }
}

function invalidate(event) {
    for (var playername in players) {
        if (players.hasOwnProperty(playername)) {
            players[playername].changes.push(event);
        }
    }
}

function addPositions(pos0, pos1) {
    return {
        x: pos0.x + pos1.x,
        y: pos0.y + pos1.y
    };
}

function updatePositions() {
    for (var playername in players) {
        if (players.hasOwnProperty(playername)) {
            let player = players[playername];
            if (player.state == DEAD) {
                if (player.countDown == 0) {
                    delete players[playername];
                } else {
                    player.countDown--;
                }
            } else {
                if (map[player.position.x][player.position.y] != player.color) {
                    player.state = TRAILING;
                    player.trail.push(player.position);
		    invalidate({event:2, name:player.name, position:player.position});
                }
                player.position = getNewPos(player.position, player.direction);
                let a = isColliding(player.position);
                if (a != -1) {
                    killPlayer(a);
                }
                if (isOutOfBounds(player.position)) {
                    killPlayer(player);
                } else {
                    if (map[player.position.x][player.position.y] == player.color && player.state == TRAILING) {
                        fill(player.trail, player.color);
                        player.trail = [];
			invalidate({event:3, name:player.name});
                        player.state = ALIVE;
                    }
                }
            }
        }
    }
    setTimeout(updatePositions, REFRESH_TIME);
}

app.listen(8888);
