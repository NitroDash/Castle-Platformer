var entities=[];

var player;
var ctx;
var bg_canvas;
var hud_canvas;
var map_canvas;
var cameraX=0;
var cameraY=0;
var level;
var roomCoords=[];
var visited=[];
var filledDoors=[];
var teleporters=[];
var world=0;
var numWorlds=2;

var numBalls=0;

var fadeDir=-1;
var fadeLength=0;
var dFade=0;

var paused=false;
var pausedAnimCounter=0;

var loading=false;

var gameOver=false;
var lastLoc={"x":1400,"y":1100,"room":0,"world":0};
var warpDest={"x":0,"y":0,"room":0,"world":0};

function setup() {
    if (playerCharacter==0) {
        player=new Ninja(1400,1100);
    } else if (playerCharacter==1){
        player=new Jetpacker(1400,1100);
    } else if (playerCharacter==2) {
        player=new Portaler(1400,1120);
    }
    for (var j=0; j<numWorlds; j++) {
        visited.push([]);
        for (var i=0; i<rooms.length; i++) {
            visited[j].push(false);
        }
    }
    hud_canvas=document.createElement("canvas");
    hud_canvas.width=800;
    hud_canvas.height=40;
    map_canvas=document.createElement("canvas");
    map_canvas.width=100;
    map_canvas.height=40;
    var mctx=map_canvas.getContext("2d");
    mctx.fillStyle="black";
    mctx.fillRect(0,0,200,200);
    bg_canvas=document.createElement("canvas");
    for (var w=0; w<numWorlds; w++) {
        roomCoords.push([]);
        for (var x=0; x<20; x++) {
            roomCoords[w].push([]);
            for (var y=0; y<20; y++) {
                roomCoords[w][x].push(0);
            }
        }
    }
    for (var w=0; w<numWorlds; w++) {
        for (var i=0; i<rooms[w].length; i++) {
            for (var x=0; x<rooms[w][i].width; x++) {
                for (var y=0; y<rooms[w][i].height; y++) {
                    roomCoords[w][rooms[w][i].x+x][rooms[w][i].y+y]=i;
                }
            }
        }
    }
    entities.push(player);
    loadLevel(0,0,function() {
        updateHUD();
        window.requestAnimationFrame(gameLoop);
    });
}

function loadLevel(ID, W, callback) {
    visited[W][ID]=true;
    for (var i=0; i<entities.length; i++) {
        if (!entities[i].survivesScreenTransition) {
            entities.splice(i,1);
            i--;
        }
    }
    loading=true;
    loadJSON("levels/"+W+"/"+ID+".json",function(response) {
        level=JSON.parse(response);
        makeLevel();
        loading=false;
        callback();
    });
}

function makeLevel() {
    tiles.length=level.width;
    for (var x=0; x<tiles.length; x++) {
        tiles[x]=[];
        tiles[x].length=level.height;
    }
    for (var i=0; i<level.rects.length; i++) {
        for (var x=level.rects[i].x; x<level.rects[i].x+level.rects[i].width;x++) {
            for (var y=level.rects[i].y; y<level.rects[i].y+level.rects[i].height; y++) {
                tiles[x][y]=level.rects[i].fill;
            }
        }
    }
    if (level.detailGrids) {
        for (var i=0; i<level.detailGrids.length; i++) {
            for (var y=0; y<level.detailGrids[i].grid.length; y++) {
                for (var x=0; x<level.detailGrids[i].grid[y].length; x++) {
                    for (var j=0; j<level.detailGrids[i].positions.length; j++) {
                        tiles[x+level.detailGrids[i].positions[j].x][y+level.detailGrids[i].positions[j].y]=level.detailGrids[i].fill[parseInt(level.detailGrids[i].grid[y].charAt(x))];
                    }
                }
            }
        }
    }
    for (var i=4; i<numImages; i++) {
        if (loadStatus[i]==2) {
            loadStatus[i]=3;
        }
    }
    if (level.enemies) {
        for (var i=0; i<level.enemies.length; i++) {
            switch (level.enemies[i].type) {
                case "Blob":
                    entities.push(new Blob(level.enemies[i].x,level.enemies[i].y,level.enemies[i].dir));
                    requestLoad(4);
                    break;
                case "Spider":
                    entities.push(new Spider(level.enemies[i].x,level.enemies[i].y));
                    requestLoad(5);
                    break;
                case "Snake":
                    entities.push(new Snake(level.enemies[i].x,level.enemies[i].y));
                    requestLoad(6);
                    requestLoad(7);
                    break;
                case "SwingBall":
                    entities.push(new SwingSpikeBall(level.enemies[i].x,level.enemies[i].y,level.enemies[i].radius,level.enemies[i].speed));
                    requestLoad(8);
                    break;
                case "1Up":
                    entities.push(new OneUp(level.enemies[i].x,level.enemies[i].y));
                    break;
                case "Gate":
                    entities.push(new CharacterOutline(level.enemies[i].x,level.enemies[i].y,level.enemies[i].character));
                    requestLoad(10);
                    break;
                case "Door":
                    entities.splice(0,0,new Door(level.enemies[i].x,level.enemies[i].y,level.enemies[i].id,level.enemies[i].dest));
                    requestLoad(11);
                    break;
                case "Teleporter":
                    entities.splice(0,0,new Teleporter(level.enemies[i].x,level.enemies[i].y,level.enemies[i].id));
                    requestLoad(12);
                    break;
                case "RocketMan":
                    entities.push(new RocketMan(level.enemies[i].x,level.enemies[i].y));
                    requestLoad(13);
                    requestLoad(15);
                    requestLoad(7);
                    break;
                case "LockDoor":
                    entities.push(new LockDoor(level.enemies[i].x,level.enemies[i].y,level.enemies[i].height));
                    requestLoad(14);
                    break;
                case "BlockSwitch":
                    entities.splice(0,0,new BlockSwitch(level.enemies[i].x,level.enemies[i].y,level.enemies[i].speed,level.enemies[i].active));
                    requestLoad(17);
                    break;
            }
        }
    }
    requestLoad(16);
    if (level.platforms) {
        for (var i=0; i<level.platforms.length; i++) {
            entities.push(new MovingPlatform(level.platforms[i].x1,level.platforms[i].y1,level.platforms[i].x2,level.platforms[i].y2,level.platforms[i].speed));
            requestLoad(9);
        }
    }
    for (var i=4; i<numImages; i++) {
        if (loadStatus[i]==3) {
            deallocate(i);
        }
    }
    bg_canvas.width=tiles.length*TILEWIDTH;
    bg_canvas.height=tiles[0].length*TILEWIDTH;
    var bg_ctx=bg_canvas.getContext("2d");
    bg_ctx.clearRect(0,0,tiles.length*TILEWIDTH,tiles[0].length*TILEWIDTH);
    for (var x=0; x<tiles.length; x++) {
        for (var y=0; y<tiles[0].length; y++) {
            if (tiles[x][y]!=0) {
                bg_ctx.drawImage(textures[0],tiles[x][y]*20-20,0,20,20,x*20,y*20,20,20);
            }
        }
    }
    updateMap();
    updateHUD();
}

function updateHUD() {
    var hctx=hud_canvas.getContext("2d");
    hctx.clearRect(0,0,800,40);
    hctx.fillStyle="gray";
    hctx.fillRect(5,5,100,20);
    hctx.fillStyle="red";
    hctx.fillRect(5,5,100*player.hp/player.maxHP,20);
    hctx.fillStyle="black";
    hctx.fillRect(700,0,200,40);
    hctx.drawImage(map_canvas,700,0);
    hctx.fillStyle="#fff";
    hctx.fillRect(748,18,4,4);
}

function updateMap() {
    var mctx=map_canvas.getContext("2d");
    mctx.fillStyle="#000";
    mctx.fillRect(0,0,100,40);
    var mapCorner={"x":level.worldCoords.x+level.width/80-5,"y":level.worldCoords.y+level.height/60-2};
    for (var i=0; i<visited[world].length; i++) {
        if (visited[world][i]) {
            drawRoom((rooms[world][i].x-mapCorner.x)*10,(rooms[world][i].y-mapCorner.y)*10,rooms[world][i].width*10,rooms[world][i].height*10,mctx);
        }
    }
}

function drawRoom(x,y,width,height,mctx) {
    mctx.fillStyle="#fff";
    mctx.fillRect(x,y,width,height);
    mctx.fillStyle="#f0f";
    mctx.fillRect(x+1,y+1,width-2,height-2);
}

function gameLoop() {
    window.requestAnimationFrame(gameLoop);
    update();
    render();
}

function warpTo(dest) {
    warpDest=dest;
    fadeDir=4;
    fadeLength=0;
    dFade=1;
}

function flipBlocks() {
    var bg_ctx=bg_canvas.getContext("2d");
    for (var x=0; x<tiles.length; x++) {
        for (var y=0; y<tiles[0].length; y++) {
            if (tiles[x][y]>=14&&tiles[x][y]<=17) {
                tiles[x][y]+=(tiles[x][y]%2==0)?1:-1;
                bg_ctx.drawImage(textures[0],tiles[x][y]*20-20,0,20,20,x*20,y*20,20,20);
            }
        }
    }
}

function update() {
    if (loading||loaded>0) {return;}
    if (paused) {
        if (pausedAnimCounter!=600) {
            pausedAnimCounter+=20;
            if (pausedAnimCounter==0) {
                paused=false;
            }
        } else {
            pauseMenu.update();
            if (pauseMenu.teleportCounter==0) {  
                player.managePauses();
            }
        }
    } else if (fadeDir>=0) {
        fadeLength+=dFade*20;
        if ((fadeDir<2&&fadeLength>=600)||(fadeDir>=2&&fadeLength>=800)) {
            var newCoords={"x":level.worldCoords.x, "y":level.worldCoords.y};
            newCoords.x+=Math.floor(player.rect.getCenterX()/800);
            newCoords.y+=Math.floor(player.rect.getCenterY()/600);
            player.rect.x=player.rect.getCenterX()%800-player.rect.width/2;
            player.rect.y=player.rect.getCenterY()%600-player.rect.height/2;
            var room=warpDest.room;
            switch (fadeDir) {
                case 0:
                    newCoords.y--;
                    player.rect.y=580-player.rect.height;
                    break;
                case 1:
                    newCoords.y++;
                    player.rect.y=10;
                    break;
                case 2:
                    newCoords.x--;
                    player.rect.x=780-player.rect.width;
                    break;
                case 3:
                    newCoords.x++;
                    player.rect.x=10;
                    break;
                case 4:
                    newCoords.x=Math.floor(warpDest.x/800)+rooms[warpDest.world][warpDest.room].x;
                    newCoords.x=Math.floor(warpDest.y/600)+rooms[warpDest.world][warpDest.room].y;
                    player.rect.x=warpDest.x-player.rect.width/2;
                    player.rect.y=warpDest.y-player.rect.height;
                    world=warpDest.world;
                    break;
            }
            if (fadeDir<4) {
                room=Math.abs(roomCoords[world][newCoords.x][newCoords.y]);
            }
            loadLevel(room,world,function() {
                console.log(player.rect.y);
                if (fadeDir<4) {
                    player.rect.x+=800*(newCoords.x-level.worldCoords.x);
                    player.rect.y+=600*(newCoords.y-level.worldCoords.y);
                }
                console.log(player.rect.y);
                lastLoc.x=player.rect.x;
                lastLoc.y=player.rect.y;
                lastLoc.room=Math.abs(roomCoords[world][newCoords.x][newCoords.y]);
                lastLoc.world=world;
                dFade=-1;
                fadeDir+=(fadeDir%2==0)?1:-1;
                updateCamera();
            });
        } else if (fadeLength<=0) {
            fadeDir=-1;
            fadeLength=0;
        }
    } else if (player.hp<=0) {
        if (fadeLength==0) {
            player.lives--;
            if (player.lives<0) {
                gameOver=true;
                lastLoc.x=1400;
                lastLoc.y=1100;
                lastLoc.room=0;
            }
        }
        fadeLength++;
        if (fadeLength>200) {
            if (gameOver) {
                loadLevel(0,0,function() {
                    player.rect.moveTo(1400,1100);
                    fadeLength=0;
                    player.lives=3;
                    gameOver=false;
                });
            } else {
                loadLevel(lastLoc.room,lastLoc.world,function() {
                    player.rect.moveTo(lastLoc.x,lastLoc.y);
                    fadeLength=0;
                });
            }
            player.dx=0;
            player.dy=0;
            player.hp=player.maxHP;
            updateHUD();
        }
    } else {
        for (var i=0; i<entities.length; i++) {
            entities[i].update();
        }
        updateCamera();
        checkForScreenTransition();
        for (var i=0; i<entities.length; i++) {
            if (!entities[i].onScreen) {
                entities[i].manageDeath();
                entities.splice(i,1);
                i--;
            }
        }
    }
}

function updateCamera() {
    cameraX=rangeRestrict(player.rect.getCenterX()-400,0,tiles.length*TILEWIDTH-800);
    cameraY=rangeRestrict(player.rect.getCenterY()-300,0,tiles[0].length*TILEWIDTH-600);
}

function pause() {
    if (!paused&&pausedAnimCounter==0) {
        paused=true;
        pausedAnimCounter=20;
        pauseMenu.init();
    } else if (paused&&pausedAnimCounter==600) {
        pausedAnimCounter=-600;
    }
}

function checkForScreenTransition() {
    if (player.rect.getRight()>=tiles.length*TILEWIDTH) {
        fadeDir=3;
        dFade=1;
    } else if (player.rect.getTop()<=0) {
        fadeDir=0;
        dFade=1;
    } else if (player.rect.getLeft()<=0) {
        fadeDir=2;
        dFade=1;
    } else if (player.rect.getBottom()>=tiles[0].length*TILEWIDTH) {
        fadeDir=1;
        dFade=1;
    }
}

function render() {
    ctx.clearRect(0,0,800,600);
    ctx.translate(-cameraX,-cameraY);
    ctx.drawImage(bg_canvas,0,0);
    for (var i=0; i<entities.length; i++) {
        entities[i].render(ctx);
    }
    ctx.translate(cameraX,cameraY);
    ctx.drawImage(hud_canvas,0,0);
    ctx.fillStyle="black";
    switch (fadeDir) {
        case 1:
            ctx.fillRect(0,0,800,fadeLength);
            break;
        case 0:
            ctx.fillRect(0,600-fadeLength,800,fadeLength);
            break;
        case 2:
            ctx.fillRect(800-fadeLength,0,fadeLength,600);
            break;
        case 3:
            ctx.fillRect(0,0,fadeLength,600);
            break;
        case 4:
        case 5:
            ctx.fillStyle="rgba(255,255,255,"+fadeLength/600+")";
            ctx.fillRect(0,0,800,600);
            break;
        case 6:
            ctx.fillStyle="rgba(255,255,255,"+(800-fadeLength)/600+")";
            ctx.fillRect(0,0,800,600);
            break;
    }
    if (fadeDir==-1&&fadeLength>0) {
        ctx.fillStyle="rgba(0,0,0,"+Math.min(fadeLength/100,1)+")";
        ctx.fillRect(0,0,800,600);
        if (fadeLength>=100) {
            if (gameOver) {
                ctx.fillStyle="#fff";
                ctx.fillText("GAME OVER",300,315);
            } else {
                ctx.drawImage(textures[1],0,0,40,40,300,260,80,80);
                ctx.fillStyle="#fff";
                ctx.fillText("x "+player.lives,400,310);
            }
        }
    }
    if (paused) {
        ctx.translate(0,-600+Math.abs(pausedAnimCounter));
        pauseMenu.render(ctx);
        ctx.translate(0,600-Math.abs(pausedAnimCounter));
    }
}