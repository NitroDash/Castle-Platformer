var pauseMenu={};
pauseMenu.map=document.createElement("canvas");
pauseMenu.map.width=800;
pauseMenu.map.height=600;
pauseMenu.renderMap=function() {
    var ctx=this.map.getContext("2d");
    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,600);
    var mapOrigin={"x":20*(level.worldCoords.x+level.width/80)-400,"y":20*(level.worldCoords.y+level.height/60)-300};
    for (var i=0; i<visited[world].length; i++) {
        if (visited[world][i]) {
            drawRoom(rooms[world][i].x*20-mapOrigin.x,rooms[world][i].y*20-mapOrigin.y,rooms[world][i].width*20,rooms[world][i].height*20,ctx);
        }
    }
    ctx.fillStyle="#fff";
    ctx.fillRect(395,295,10,10);
    ctx.fillStyle="#0ff"
    var currentRoom=Math.abs(roomCoords[world][level.worldCoords.x][level.worldCoords.y]);
    this.teleporters.splice(0,this.teleporters.length);
    for (var i=0; i<teleporters.length; i++) {
        if (teleporters[i]!=null&&teleporters[i].room!=currentRoom&&teleporters[i].world==world) {
            var coords={"x":rooms[world][teleporters[i].room].x*20+rooms[world][teleporters[i].room].width*10-mapOrigin.x,"y":rooms[world][teleporters[i].room].y*20+rooms[world][teleporters[i].room].height*10-mapOrigin.y};
            ctx.fillRect(coords.x-5,coords.y-5,10,10);
            this.teleporters.push({"x":coords.x,"y":coords.y,"id":i});
        } else {
            this.teleporters.push({"x":NaN,"y":NaN,"id":i});
        }
    }
}

pauseMenu.cursor={"x":0,"y":0};
pauseMenu.cursorSpeed=2;
pauseMenu.hovering=-1;

pauseMenu.teleporters=[];
pauseMenu.teleportCounter=0;

pauseMenu.init=function() {
    this.renderMap();
    this.cursor.x=400;
    this.cursor.y=300;
    this.hovering=-1;
    this.teleportCounter=0;
}

pauseMenu.update=function() {
    if (loading) {return;}
    if (this.teleportCounter!=0) {
        this.teleportCounter++;
        if (this.teleportCounter==110) {
            loadLevel(teleporters[this.hovering].room,world,function() {
                pauseMenu.teleportCounter=-110;
                player.rect.moveTo(teleporters[pauseMenu.hovering].x,teleporters[pauseMenu.hovering].y);
                updateCamera();
                loading=false;
            });
        } else if (this.teleportCounter==0) {
            paused=false;
            pausedAnimCounter=0;
        }
    } else {
        this.ballAnimCounter++;
        if (this.ballAnimCounter>5) {
            this.ballAnimCounter=0;
            this.img++;
            this.img%=5;
        }
        if (keys[0].isDown) {
            this.cursor.y-=this.cursorSpeed;
        } else if (keys[1].isDown) {
            this.cursor.y+=this.cursorSpeed;
        }
        if (keys[2].isDown) {
            this.cursor.x-=this.cursorSpeed;
        } else if (keys[3].isDown) {
            this.cursor.x+=this.cursorSpeed;
        }
        this.hovering=-1;
        for (var i=0; i<this.teleporters.length; i++) {
            if (Math.abs(this.teleporters[i].x-this.cursor.x)+Math.abs(this.teleporters[i].y-this.cursor.y)<=13) {
                this.hovering=i;
                break;
            }
        }
        if (keys[4].isDown&&this.hovering!=-1) {
            this.teleportCounter=1;
        }
    }
}

pauseMenu.img=0;
pauseMenu.ballAnimCounter=0;

pauseMenu.render=function(ctx) {
    if (this.teleportCounter!=0) {
        ctx.fillStyle="rgba(255,255,255,"+Math.abs(this.teleportCounter)/100+")";
        ctx.fillRect(0,0,800,600);
    } else {
        ctx.drawImage(this.map,0,0);
        if (this.hovering==-1) {
            ctx.strokeStyle="#fff";
        } else {
            ctx.strokeStyle="#00f";
        }
        ctx.strokeRect(this.cursor.x-8,this.cursor.y-8,16,16);
        for (var i=0; i<numBalls; i++) {
            ctx.drawImage(textures[3],40*this.img,0,40,40,i*20,0,20,20);
        }
    }
}