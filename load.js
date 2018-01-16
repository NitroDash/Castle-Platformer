var tileset, shuriken, blob, spider, drops, fireball, platform, spikeBall,oneUp,smoke,playerImg,outlines,portal,door,teleporter,rocketMan,lockDoor,bomb,nick;

var textures=[];
var loadStatus=[];

var srcs=[null,"images/ninja.png","images/Jetpacker.png","images/Portaler.png","images/blob.png","images/spider.png","images/snake.png","images/fireball.png","images/SpikeBall.png","images/movingPlatform.png","images/characterOutlines.png","images/door.png","images/teleporter.png","images/rocketMan.png","images/lockDoor.png","images/Bomb.png","images/drops.png","images/blockSwitch.png"];

var numImages=20;
var loaded=0;
var playerCharacter=0;

var hasSetup=0;

var renderHitboxes=false;
var allowZipping=false;
var ezDoors=false;

function load() {
    textures[0]=loadImage("images/tiles.png",0);
    if (playerCharacter==0) {
        textures[1]=loadImage("images/ninja.png",1);
        textures[2]=loadImage("images/shuriken.png",2);
    } else if (playerCharacter==1) {
        textures[1]=loadImage("images/Jetpacker.png",1);
        textures[2]=loadImage("images/jetpackSmoke.png",2);
    } else if (playerCharacter==2) {
        textures[1]=loadImage("images/Portaler.png",1);
        textures[2]=loadImage("images/portal.png",2);
    }
    textures[3]=loadImage("images/ball.png",3);
}

function loadSelect() {
    for (var i=0; i<numImages; i++) {
        textures.push(null);
        loadStatus.push(0);
    }
    requestLoad(1);
    requestLoad(2);
    requestLoad(3);
}

function requestLoad(id) {
    if (loadStatus[id]==0) {
        textures[id]=loadImage(srcs[id],id);
    } else if (loadStatus[id]==3) {
        loadStatus[id]=2;
    }
}

function deallocate(id) {
    textures[id]=null;
    loadStatus[id]=0;
}

function loadImage(src,id) {
    loaded++;
    loadStatus[id]=1;
    var obj=new Image();
    obj.src=src;
    obj.onload=function() {incrementLoad(id);};
    return obj;
}

function incrementLoad(id) {
    loaded--;
    if (id!=null) {
        loadStatus[id]=2;
    }
    if (loaded<=0) {
        if (hasSetup==0) {
            hasSetup=1;
            setupSelect();
        } else if (hasSetup==1) {
            hasSetup=2;
            setup();
        }
    }
}

var tileWalls=[
    [false,false,false,false,false],
    [true,true,true,true,false],
    [true,false,false,false,false],
    [true,true,true,true,false],
    [true,true,true,true,false],
    [true,true,true,true,false],
    [false,false,false,false,false],
    [false,false,false,false,false],
    [false,false,false,false,false],
    [false,false,false,false,false],
    [true,true,true,true,true],
    [true,true,true,true,true],
    [true,true,true,true,true],
    [true,true,true,true,true],
    [false,false,false,false,false],
    [true,true,true,true,false],
    [false,false,false,false,false],
    [true,true,true,true,false]
];

function getWall(tile,direction) {
    return tileWalls[tile][direction];
}

function loadJSON(filename,callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', filename, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }