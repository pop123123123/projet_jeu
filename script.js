var server = "localhost:8888";
var CELL_HEIGHT = 30;
var CELL_WIDTH = 30;
var REFRESH_TIME = 200;
var ANIMATION_DELAY = 50;


var map = [];
var player = {};
var players = {};

$.get("new_player", start);

function getColor(i, trail) {
    if (trail == undefined) {
        trail = false;
    }
    if (trail) {
        switch (i) {
            case -1:
                return "rgba(255,255,255,0.5)";
            case 0:
                return "rgba(0,255,0,0.5)";
            case 1:
                return "rgba(255,0,0,0.5)";
            case 2:
                return "rgba(0,0,255,0.5)";
            case 3:
                return "rgba(255,255,0,0.5)";
            case 4:
                return "rgba(255,0,255,0.5)";
            case 5:
                return "rgba(0,0,100,0.5)";
        }
    } else {
        switch (i) {
            case -1:
                return "white";
            case 0:
                return "#0A0";
            case 1:
                return "#A00";
            case 2:
                return "#00A";
            case 3:
                return "#AA0";
            case 4:
                return "#A0A";
            case 5:
                return "#006";
        }
    }
}

function start(res) {
    res = JSON.parse(res);
    map = res.map;
    player = res.player;
    players = res.players;
    $('#container').css('position', 'relative')
        .css('top', '0')
        .css('left', '0');

    var $map = $('<div/>').attr('id', 'map')
        .css('position', 'absolute')
        .css('width', (CELL_WIDTH * map.length) + "px")
        .css('height', (CELL_HEIGHT * map[0].length) + "px");
    $('#container').append($map);
    refreshMap(map);
    $('#container').append(createGrid(map));

    var $trails = $('<div/>').attr('id', 'trails');
    var $players = $('<div/>').attr('id', 'players');
    $('#container').append($trails).append($players);
    for (var playername in players) {
        if (players.hasOwnProperty(playername)) {
            newPlayer(players[playername]);
        }
    }
    refreshTrails(players);
    setTimeout(() => {
        $.post("update", {
            direction: -1,
            username: player.name
        }, refresh);
    }, REFRESH_TIME);
}

function createGrid(map) {
    var bw = map.length * CELL_WIDTH;
    var bh = map[0].length * CELL_HEIGHT;

    var canvas = $('<canvas/>').attr({
        width: bw,
        height: bh
    }).css('position', 'absolute');

    var context = canvas.get(0).getContext("2d");

    for (var x = 0; x <= bw; x += CELL_WIDTH) {
        context.moveTo(0.5 + x, 0);
        context.lineTo(0.5 + x, bh);
    }


    for (var x = 0; x <= bh; x += CELL_HEIGHT) {
        context.moveTo(0, 0.5 + x);
        context.lineTo(bw, 0.5 + x);
    }

    context.strokeStyle = "black";
    context.stroke();

    return canvas;
}

function newPlayer(p) {
    if (p.state != 2) {
        var $p = $('<div/>')
            .css('background', getColor(p.color, true))
            .attr('id', p.name)
            .css('width', CELL_WIDTH + "px")
            .css('height', CELL_HEIGHT + "px")
            .css('position', 'absolute')
            .css('top', (CELL_HEIGHT * p.position.y) + "px")
            .css('left', (CELL_WIDTH * p.position.x) + "px")
            .append($('<p/>').text(p.name).addClass('label'));
        $('#players').append($p);
    }
}

function removePlayer(p) {
    $('#' + p.name).remove();
}

function refreshMap(newMap) {
    // to edit, really bad optimisation for the moment
    $map = $('#map');
    $map.empty();
    var height = newMap[0].length;
    var width = newMap.length;
    for (var x = 0; x < width; x++) {
        var $col = $('<div/>')
            .css('width', (CELL_WIDTH) + "px")
            .css('height', (CELL_HEIGHT * height) + "px")
            .css('position', 'absolute')
            .css('left', (CELL_WIDTH * x) + "px");
        for (var y = 0; y < height; y++) {
            var $cell = $('<div/>')
                .css('background', getColor(newMap[x][y]))
                .css('width', CELL_WIDTH + "px")
                .css('height', CELL_HEIGHT + "px")
                .css('position', 'absolute')
                .css('top', (CELL_HEIGHT * y) + "px");
            $col.append($cell);
        }
        $map.append($col);
    }

}

function refreshTrails(ps) {
    // to edit, really bad optimisation for the moment
    $trails = $('#trails');
    $trails.empty();
    for (var playername in ps) {
        if (players.hasOwnProperty(playername)) {
            var p = ps[playername];
            for (var x = 0; x < p.trail.length; x++) {
                var $cell = $('<div/>')
                    .css('background', getColor(p.color, true))
                    .addClass(p.name)
                    .css('width', CELL_WIDTH + "px")
                    .css('height', CELL_HEIGHT + "px")
                    .css('position', 'absolute')
                    .css('top', (CELL_HEIGHT * p.trail[x].y) + "px")
                    .css('left', (CELL_WIDTH * p.trail[x].x) + "px");
                $trails.append($cell);
            }
        }
    }
}

function refresh(res) {
    res = JSON.parse(res);
    for (var playername in res.players) {
        if (res.players.hasOwnProperty(playername)) {

            if (players.hasOwnProperty(playername)) {
                var p = res.players[playername];
                if (p.state == 2) {
                    removePlayer(p);
                } else {
                    if (p.position.x != players[playername].position.x || p.position.y != players[playername].position.y) {
                        /*if (player.name == playername) {
                            vardiff = vector(getCoords($('#' + playername)), {
                                x: (CELL_WIDTH * p.position.x),
                                y: (CELL_HEIGHT * p.position.y)
                            });
                            var x0 = (vardiff.x < 0 ? "-=" + Math.abs(vardiff.x) : "+=" + vardiff.x);
                            var y0 = (vardiff.y < 0 ? "-=" + Math.abs(vardiff.y) : "+=" + vardiff.y);
                            $('#container').animate({
                                left: x0,
                                top: y0,
                            }, {
                                duration: 1000,
                                easing: "swing",
                                queue: true
                            });
                        } else {*/
                        vardiff = vector({
                            x: (CELL_WIDTH * p.position.x),
                            y: (CELL_HEIGHT * p.position.y)
                        }, getCoords($('#' + playername)));
                        var x0 = (vardiff.x < 0 ? "-=" + Math.abs(vardiff.x) : "+=" + vardiff.x);
                        var y0 = (vardiff.y < 0 ? "-=" + Math.abs(vardiff.y) : "+=" + vardiff.y);
                        $('#' + playername).animate({
                            left: x0,
                            top: y0,
                        }, {
                            duration: 200,
                            easing: "swing",
                            queue: true
                        });
                        //}
                    }
                }
                players[playername] = res.players[playername]
            } else {
                newPlayer(res.players[playername]);
            }
        }
    }
    dead = false;
    for (var playername in players) {
        if (players.hasOwnProperty(playername)) {
            if (!res.players.hasOwnProperty(playername)) {
                removePlayer(players[playername]);
                if (playername == player.name) {
                    dead = true;
                    alert('Vous êtes mort');
                }
            }
        }
    }
    if (res.players[player.name].change) {
        refreshMap(res.map);
    }
    refreshTrails(res.players);
    map = res.map;
    players = res.players;
    player = players[player.name];
    if (!dead) {
        setTimeout(() => {
            $.post("update", {
                direction: -1,
                username: player.name
            }, refresh);
        }, REFRESH_TIME);
    }
}

function directionChange(direction) {
    $.post('update', {
        direction: direction,
        username: player.name
    });
}

function vector(v0, v1) {
    return {
        x: v0.x - v1.x,
        y: v0.y - v1.y
    };
}

function norm(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function addVectors(v0, v1) {
    return {
        x: v0.x + v1.x,
        y: v0.y + v1.y
    };
}

function scal(s, v) {
    return {
        x: s * v.x,
        y: s * v.y
    };
}

function getCoords($div) {
    return {
        x: parseInt($div.css('left').replace('px', '')),
        y: parseInt($div.css('top').replace('px', ''))
    };
}

function moveTo($div, position, time) {
    if (animated) {
        animated = false;
        setTimeout(() => {
            moveTo($div, position, time);
        }, ANIMATION_DELAY);
    } else {
        var cpos = getCoords($div);
        var v = vector(position, cpos);
        var stepv = scal(ANIMATION_DELAY / time, v);
        var count = Math.floor(time / ANIMATION_DELAY);
        var cpos = getCoords($div);
        animated = true;
        var id = setInterval(frame, ANIMATION_DELAY);

    }

    function frame() {
        if (animated) {
            count--;
            cpos = addVectors(cpos, stepv);
            $div.css('top', cpos.y + "px")
                .css('left', cpos.x + "px");
            if (count == 0) {
                animated = false;
                clearInterval(id);
            }
        } else {
            clearInterval(id);
            $div.css('top', position.y + "px")
                .css('left', position.x + "px");

        }
    }
}
animated = false;

function moveBy($div, position, time) {
    if (animated) {
        animated = false;
        setTimeout(() => {
            moveBy($div, position, time);
        }, ANIMATION_DELAY);
    } else {
        var stepv = scal(ANIMATION_DELAY / time, position);
        var count = Math.floor(time / ANIMATION_DELAY);
        var cpos = getCoords($div);
        var cfinal = addVectors(cpos, position);
        animated = true;
        var id = setInterval(frame, ANIMATION_DELAY);

    }

    function frame() {
        if (animated) {
            count--;
            cpos = addVectors(cpos, stepv);
            $div.css('top', cpos.y + "px")
                .css('left', cpos.x + "px");
            if (count == 0) {
                animated = false;
                clearInterval(id);
            }
        } else {
            clearInterval(id);
            $div.css('top', cfinal.y + "px")
                .css('left', cfinal.x + "px");

        }
    }

}

$(document).keydown(function(e) {
    var i = 0;
    switch (e.which) {
        case 37: // left
            i = 1;
            break;

        case 38: // up
            i = 0;
            break;

        case 39: // right
            i = 3;
            break;

        case 40: // down
            i = 2;
            break;

        default:
            return; // exit this handler for other keys
    }
    directionChange(i);
    e.preventDefault(); // prevent the default action (scroll / move caret)
});
