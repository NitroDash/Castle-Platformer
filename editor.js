var keys=[keyboard(38),keyboard(40),keyboard(37),keyboard(39),keyboard(16),keyboard(32),keyboard(8),keyboard(13),keyboard(69),keyboard(189)];
var width;
var height;
var rects=[];
var enemies=[];
var ctx;
var bg_canvas;
var bgctx;

var state=0;

var camera={"x":0,"y":0};
var cursor={"x":0,"y":0};
var selected={"x":0,"y":0};

class Rect {
    constructor(x,y,width,height,fill) {
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        this.fill=fill;
    }
}

class Enemy {
    constructor(x,y,type,params) {
        if (params) {
            this.type=params.type;
            this.x=params.x;
            this.y=params.y;
            if (this.type=="SwingBall") {
                this.radius=params.radius;
                this.speed=params.speed;
            } else if (this.type=="Gate") {
                this.character=params.character;
            }
        } else {
            this.type=type;
            this.x=x;
            this.y=y;
            if (this.type=="SwingBall") {
                this.radius=parseInt(prompt("What radius?"));
                this.speed=10;
            } else if (this.type=="Gate") {
                this.character=parseInt(prompt("Which character can pass?"));
            }
        }
    }
    
    render(ctx) {
        if (this.type=="Blob") {
            ctx.drawImage(textures[4],0,0,30,30,this.x-30,this.y-60,60,60);
        } else if (this.type=="SwingBall") {
            ctx.strokeStyle="#444";
            ctx.beginPath();
            ctx.moveTo(this.x,this.y);
            ctx.lineTo(this.x,this.y+this.radius);
            ctx.stroke();
            ctx.drawImage(textures[8],this.x-40,this.y+this.radius-40,80,80);
        } else if (this.type=="Snake") {
            ctx.drawImage(textures[6],0,0,17,18,this.x-34,this.y-72,68,72);
        } else if (this.type=="Spider") {
            ctx.drawImage(textures[5],this.x-20,this.y);
        } else if (this.type=="Gate") {
            ctx.drawImage(textures[10],40*this.character,0,40,40,this.x,this.y,80,80);
        } else if (this.type=="1Up") {
            ctx.drawImage(textures[3],this.x-20,this.y-20);
        } else if (this.type=="BlockSwitch") {
            ctx.drawImage(textures[17],this.x,this.y,160,40);
        }
    }
}

function setupSelect() {
    load();
}

function setup() {
    for (var i=4; i<numImages; i++) {
        requestLoad(i);
    }
    if (prompt("Enter preexisting level data?")=="Yes") {
        var level=JSON.parse(prompt("Enter data."));
        width=level.width/40;
        height=level.height/30;
        rects=level.rects;
        if (level.enemies) {
            for (var i=0; i<level.enemies.length; i++) {
                enemies.push(new Enemy(0,0,"",level.enemies[i]));
            }
        }
    } else {
        width=prompt("Enter the width of your level");
        height=prompt("Enter the height of your level");
    }
    var canvas=document.getElementById("canvas");
    ctx=canvas.getContext("2d");
    ctx.font="30px Verdana";
    ctx.imageSmoothingEnabled=false;
    
    bg_canvas=document.createElement("canvas");
    bg_canvas.width=800*width;
    bg_canvas.height=600*height;
    bgctx=bg_canvas.getContext("2d");
    
    for (var x=0; x<width*40; x++) {
        for (var y=0; y<height*30; y++) {
            bgctx.drawImage(textures[0],100,0,20,20,x*20,y*20,20,20);
        }
    }
    
    if (rects.length>0) {
        for (var i=0; i<rects.length; i++) {
            drawRect(rects[i].x,rects[i].y,rects[i].width,rects[i].height,rects[i].fill);
        }
    } else {
        rects.push(new Rect(0,0,width*40,height*30,6));
    }
    
    window.requestAnimationFrame(gameLoop);
}

function gameLoop() {
    window.requestAnimationFrame(gameLoop);
    update();
    render();
}

function update() {
    if (keys[0].isDown) {
        cursor.y=Math.max(0,cursor.y-1);
        if (cursor.y*20<camera.y) {
            camera.y-=20;
        }
        keys[0].isDown=false;
    }
    if (keys[1].isDown) {
        cursor.y=Math.min(height*30-1,cursor.y+1);
        if (cursor.y*20>=camera.y+600) {
            camera.y+=20;
        }
        keys[1].isDown=false;
    }
    if (keys[2].isDown) {
        cursor.x=Math.max(0,cursor.x-1);
        if (cursor.x*20<camera.x) {
            camera.x-=20;
        }
        keys[2].isDown=false;
    }
    if (keys[3].isDown) {
        cursor.x=Math.min(width*40-1,cursor.x+1);
        if (cursor.x*20>=camera.x+800) {
            camera.x+=20;
        }
        keys[3].isDown=false;
    }
    
    if (state==0) {
        if (keys[5].isDown) {
            selected.x=cursor.x;
            selected.y=cursor.y;
            keys[5].isDown=false;
            state=1;
        } else if (keys[6].isDown&&rects.length>1) {
            keys[6].isDown=false;
            rects.splice(rects.length-1,1);
            for (var i=0; i<rects.length; i++) {
                drawRect(rects[i].x,rects[i].y,rects[i].width,rects[i].height,rects[i].fill);
            }
        } else if (keys[7].isDown) {
            keys[7].isDown=false;
            printLevel();
        } else if (keys[8].isDown) {
            keys[8].isDown=false;
            var enemy=prompt("Which kind of enemy?");
            enemies.push(new Enemy(cursor.x*20,cursor.y*20,enemy));
        } else if (keys[9].isDown) {
            if (enemies.length>0) {
                enemies.splice(enemies.length-1,1);
            }
            keys[9].isDown=false;
        }
    } else if (state==1) {
        if (keys[5].isDown) {
            keys[5].isDown=false;
            var fill=parseInt(prompt("Fill with which tile?"));
            var newRect=new Rect(Math.min(cursor.x,selected.x),Math.min(cursor.y,selected.y),Math.abs(cursor.x-selected.x)+1,Math.abs(cursor.y-selected.y)+1,fill);
            drawRect(newRect.x,newRect.y,newRect.width,newRect.height,fill);
            rects.push(newRect);
            state=0;
        }
    }
}

function printLevel() {
    var level={"width":width*40,"height":height*30,"rects":rects};
    if (enemies.length>0) {
        level.enemies=enemies;
    }
    document.getElementById("output").innerHTML=JSON.stringify(level);
}

function drawRect(x,y,width,height,fill) {
    console.log("Drawing "+x+" "+y+" "+width+" "+height+" "+fill);
    fill--;
    bgctx.fillStyle="#fff";
    bgctx.fillRect(x*20,y*20,width*20,height*20);
    for (var x1=x;x1<x+width;x1++) {
        for (var y1=y;y1<y+height; y1++) {
            bgctx.drawImage(textures[0],fill*20,0,20,20,x1*20,y1*20,20,20);
        }
    }
}

function render() {
    ctx.translate(-camera.x,-camera.y)
    ctx.drawImage(bg_canvas,0,0);
    ctx.strokeStyle="#f00";
    ctx.beginPath();
    if (state==0) {
        ctx.rect(cursor.x*20,cursor.y*20,20,20);
    } else if (state==1) {
        ctx.rect(Math.min(cursor.x,selected.x)*20,Math.min(cursor.y,selected.y)*20,Math.abs(cursor.x-selected.x)*20+20,Math.abs(cursor.y-selected.y)*20+20);
    }
    ctx.stroke();
    for (var i=0; i<enemies.length; i++) {
        enemies[i].render(ctx);
    }
    ctx.translate(camera.x,camera.y);
    ctx.fillStyle="#000";
    ctx.fillRect(0,600,800,20);
}