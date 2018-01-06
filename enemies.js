class Enemy extends Entity {
    constructor(x,y,width,height) {
        super(x,y,width,height);
        this.dir=0;
        this.hp=1;
        this.justHit=false;
    }
    
    getAlignment() {
        return 2;//Enemy
    }
    
    getHit(damage) {
        this.hp-=damage;
        if (this.hp<=0) {
            this.onScreen=false;
        }
        this.justHit=true;
    }
    
    getDamage() {
        return 1;
    }
    
    manageDeath() {
        if (Math.random()<0.7) {
            entities.push(new Heart(this.rect.getCenterX(),this.rect.getCenterY()));
        }
    }
}

class Blob extends Enemy {
    constructor(x,y,dir) {
        super(x-30,y-60,60,60);
        this.dir=Math.floor(Math.random()*2);
        if (dir==1) {
            this.dir=0;
        } else if (dir==-1) {
            this.dir=1;
        }
        this.dx=(this.dir==0)?2:-2;
        this.hp=15;
        this.walkCounter=0;
        this.hitbox.width=30;
        this.hitbox.moveTo(15,0);
    }
    
    update() {
        this.rect.translate(this.dx,0);
        if (this.dx>0&&!getWall(getTile(Math.floor(this.rect.getRight()/TILEWIDTH),Math.floor(this.rect.getBottom()/TILEWIDTH),0),0)) {
            this.dx*=-1;
            this.dir=1-this.dir;
        } else if (this.dx<0&&!getWall(getTile(Math.floor(this.rect.getLeft()/TILEWIDTH),Math.floor(this.rect.getBottom()/TILEWIDTH),0),0)) {
            this.dx*=-1;
            this.dir=1-this.dir;
        }
        this.ejectFromWalls();
        this.walkCounter++;
        if (this.walkCounter>=8) {
            this.walkCounter=0;
        }
    }
    
    hitWall() {
        this.dx*=-1;
        this.dir=1-this.dir;
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        if (!this.justHit) {
            ctx.drawImage(textures[4],30*Math.floor(this.walkCounter/2),30*this.dir,30,30,this.rect.getLeft(),this.rect.getTop(),60,60);
        }
        this.justHit=false;
    }
}

class Spider extends Enemy {
    constructor(x,y) {
        super(x-20,y,40,30);
        this.baseX=x;
        this.baseY=y;
        this.dy=0;
        this.state=0;
        this.hp=10;
        this.stateCounter=0;
    }
    
    update() {
        if (this.state==0) {
            if (Math.abs(player.rect.getCenterX()-this.rect.getCenterX())<240) {
                this.state=1;
                this.dy=10;
            }
        } else if (this.state==1) {
            this.rect.translate(0,this.dy);
            this.ejectFromFloor();
        } else if (this.state==2) {
            this.rect.translate(0,this.dy);
            if (this.rect.getTop()<this.baseY) {
                this.rect.moveTo(this.rect.getLeft(),this.baseY);
                this.state=0;
                this.dy=0;
            } else {
                this.stateCounter--;
                if (this.stateCounter<=0) {
                    this.resetStateCounter();
                    this.state=3;
                }
            }
        } else if (this.state==3) {
            this.stateCounter--;
            if (this.stateCounter<=0) {
                this.resetStateCounter();
                this.state=2;
            }
        }
    }
    
    hitFloor() {
        this.state=2;
        this.dy=-5;
    }
    
    resetStateCounter() {
        this.stateCounter=Math.floor(Math.random()*30+30);
        if (this.state==2) {
            this.stateCounter/=2;
        }
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        if (!this.justHit) {
            ctx.strokeStyle="#000000";
            ctx.beginPath();
            ctx.moveTo(this.baseX,this.baseY);
            ctx.lineTo(this.rect.getCenterX(),this.rect.getCenterY());
            ctx.stroke();
            ctx.drawImage(textures[5],this.rect.getLeft(),this.rect.getTop());
        }
        this.justHit=false;
    }
}

class Snake extends Enemy {
    constructor(x,y) {
        super(x-34,y-72,68,72);
        this.dir=0;
        this.hp=20;
        this.hitbox.width=36;
        this.hitbox.moveTo(18,0);
        this.image=0;
        this.fireballCountdown=Math.floor(Math.random()*100)+300;
    }
    
    update() {
        if (this.rect.getCenterX()>player.rect.getCenterX()) {
            this.dir=1;
        } else {
            this.dir=0;
        }
        this.fireballCountdown--;
        if (this.fireballCountdown==0) {
            this.image=1;
            entities.push(new Fireball((this.dir==0)?this.rect.getRight():this.rect.getLeft(),this.rect.getTop()+20,this.dir));
        } else if (this.fireballCountdown==-20) {
            this.image=0;
            this.fireballCountdown=Math.floor(Math.random()*100)+300;
        }
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        if (!this.justHit) {
            ctx.drawImage(textures[6],this.image*17,this.dir*18,17,18,this.rect.getLeft(),this.rect.getTop(),this.rect.width,this.rect.height);
        }
        this.justHit=false;
    }
}

class Fireball extends Enemy {
    constructor(x,y,dir) {
        super(x-15,y-20,30,20);
        this.dir=dir;
        this.hp=1;
        this.dx=(this.dir==0)?6:-6;
    }
    
    update() {
        this.rect.translate(this.dx,0);
        this.ejectFromWalls();
    }
    
    hitWall() {
        this.onScreen=false;
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        ctx.drawImage(textures[7],0,20*this.dir,30,20,this.rect.getLeft(),this.rect.getTop(),this.rect.width,this.rect.height);
    }
    
    manageDeath() {}
}

class SwingSpikeBall extends Enemy {
    constructor(x,y,radius,speed) {
        super(x-40,y+radius-40,80,80);
        this.pivot={"x":x,"y":y};
        this.center={"x":x,"y":y+radius};
        this.radius=radius;
        this.theta=0;
        this.dTheta=1;
        this.baseEnergy=0.5*speed*speed;
        this.maxHeight=Math.acos(1-this.baseEnergy/this.radius);
    }
    
    update() {
        var v=Math.sqrt(Math.max(2*(this.baseEnergy+(Math.cos(this.theta)*this.radius)-this.radius),0.001))/this.radius;
        this.theta+=this.dTheta*v;
        if (this.theta>this.maxHeight-0.005) {
            this.dTheta=-1;
        } else if (this.theta<-this.maxHeight+0.005) {
            this.dTheta=1;
        }
        this.center.x=this.pivot.x+this.radius*Math.sin(this.theta);
        this.center.y=this.pivot.y+this.radius*Math.cos(this.theta);
        this.rect.moveTo(this.center.x-40,this.center.y-40);
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        ctx.strokeStyle="#000000";
        ctx.beginPath();
        ctx.moveTo(this.pivot.x,this.pivot.y);
        ctx.lineTo(this.rect.getCenterX(),this.rect.getCenterY());
        ctx.stroke();
        ctx.drawImage(textures[8],this.rect.getLeft(),this.rect.getTop(),80,80);
    }
    
    getHit(damage) {
    }
}

class CharacterOutline extends Entity {
    constructor(x,y,character) {
        super(x,y,80,80);
        this.char=character;
    }
    
    getAlignment() {
        return 400;
    }
    
    update() {
        if (playerCharacter!=this.char&&player.rect.intersects(this.rect)) {
            player.ejectFromRect(this.rect.getLeft(),this.rect.getTop(),this.rect.width,this.rect.height,[true,true,false,true]);
        }
    }
    
    render(ctx) {
        ctx.drawImage(textures[10],40*this.char,0,40,40,this.rect.getLeft(),this.rect.getTop(),80,80);
    }
}

class Door extends Entity {
    constructor(x,y,ID,dest) {
        super(x,y,80,120);
        this.ID=ID;
        this.dest=dest;
        while (filledDoors.length<=ID){
            filledDoors.push(0);
        }
        this.numFilled=filledDoors[ID];
        this.open=false;
        if (this.numFilled==6) {
            this.open=true;
        }
        this.img=0;
        this.animCounter=0;
    }
    
    update() {
        this.animCounter++;
        if (this.animCounter>5) {
            this.animCounter=0;
            this.img++;
            this.img%=5;
        }
        if (!this.open&&numBalls>0&&keys[1].isDown&&player.rect.intersects(this.rect)) {
            keys[1].isDown=false;
            numBalls--;
            this.numFilled++;
            filledDoors[this.ID]=this.numFilled;
            if (this.numFilled==6) {
                this.open=true;
            }
        } else if (this.open&&keys[1].isDown&&player.rect.intersects(this.rect)) {
            warpTo(this.dest);
        }
    }
    
    render(ctx) {
        ctx.drawImage(textures[11],this.open?40:0,0,40,60,this.rect.getLeft(),this.rect.getTop(),80,120);
        if (!this.open) {
            for (var i=0; i<this.numFilled; i+=2) {
                ctx.drawImage(textures[3],this.img*40,0,40,40,this.rect.getLeft()+10,this.rect.getTop()+15*i+10,20,20);
            }
            for (var i=1; i<this.numFilled; i+=2) {
                ctx.drawImage(textures[3],this.img*40,0,40,40,this.rect.getLeft()+50,this.rect.getTop()+15*i-5,20,20);
            }
        }
    }
}

class Teleporter extends Entity {
    constructor(x,y,ID) {
        super(x-40,y-24,80,24);
        while (teleporters.length<=ID) {
            teleporters.push(null);
        }
        this.active=false;
        if (teleporters[ID]!=null) {
            this.setHeight(120);
            this.active=true;
        }
        this.ID=ID;
        this.blueLines=[12,50,-50];
    }
    
    update() {
        if (this.active) {
            if (this.rect.height<120) {
                this.setHeight(this.rect.height+3);
            }
            for (var i=0; i<this.blueLines.length; i++) {
                this.blueLines[i]+=2;
                if (this.blueLines[i]>=68) {
                    this.blueLines[i]=-68;
                } else if (Math.abs(this.blueLines[i])<12) {
                    this.blueLines[i]=12;
                }
            }
        } else if (keys[1].isDown&&player.rect.intersects(this.rect)) {
            this.active=true;
            teleporters[this.ID]={"x":this.rect.getLeft(),"y":this.rect.getTop()-80,"room":Math.abs(roomCoords[world][level.worldCoords.x][level.worldCoords.y]),"world":world};
        }
    }
    
    setHeight(h) {
        this.rect.y=this.rect.getBottom()-h;
        this.rect.height=h;
    }
    
    render(ctx) {
        ctx.drawImage(textures[12],0,0,40,6,this.rect.getLeft(),this.rect.getTop(),80,12);
        ctx.drawImage(textures[12],0,6,40,6,this.rect.getLeft(),this.rect.getBottom()-12,80,12);
        if (this.rect.height>24) {
            ctx.fillStyle="#0ff";
            for (var i=0; i<this.blueLines.length; i++) {
                ctx.fillRect(Math.abs(this.blueLines[i])+this.rect.getLeft(),this.rect.getTop()+12,4,this.rect.height-24);
            }
        }
    }
}

class RocketMan extends Enemy {
    constructor(x,y) {
        super(x-32,y-128,64,128);
        this.blinkAnim=-500;
        this.img=0;
        this.dx=0;
        this.dy=0;
        this.firing=false;
        this.stateCounter=0;
        this.state=0;
        this.hitTile=false;
        this.hp=100;
        this.shootCounter=200;
    }
    
    update() {
        this.hitTile=false;
        this.blinkAnim++;
        if (this.blinkAnim>20) {
            this.img=0;
            this.blinkAnim=-1000;
        } else if (this.blinkAnim>15) {
            this.img=1;
        } else if (this.blinkAnim>5) {
            this.img=2;
        } else if (this.blinkAnim>0) {
            this.img=1;
        }
        if (this.state==0) {
            this.stateCounter++;
            if (this.stateCounter>120) {
                this.state=1;
                this.firing=true;
                this.stateCounter=0;
            }
        } else if (this.state==1) {
            this.stateCounter++;
            if (this.stateCounter>60) {
                this.state=0;
                this.firing=false;
                this.stateCounter=-120;
                this.dx=Math.max(-8,Math.min(8,(player.rect.getCenterX()-this.rect.getCenterX())/40));
            }
        }
        if (this.firing) {
            this.dy-=1.2;
        }
        this.dy+=1;
        if (this.dy>20) {
            this.dy=20;
        }
        this.rect.translate(this.dx,this.dy);
        this.ejectFromTerrain();
        this.shootCounter--;
        if (this.shootCounter<=0) {
            entities.push(new Bomb(this.rect.getCenterX()-20,this.rect.getTop(),Math.random()*8-4,Math.random()*-5-10));
            this.shootCounter=Math.random()*100+150;
        }
    }
    
    hitFloor(rect) {
        if (this.hitTile||this.dy<0) {return;}
        this.hitTile=true;
        if (this.dy>2) {
            this.dy*=-0.3;
        } else {
            this.dy=0;
        }
        this.dx*=0.5;
    }
    
    hitWall(rect) {
        if (this.hitTile) {return;}
        this.hitTile=true;
        this.dx*=-1;
    }
    
    hitCeiling(rect) {
        if (this.hitTile) {return;}
        this.hitTile=true;
        this.dy*=-1;
    }
    
    render(ctx) {
        if (this.justHit) {this.justHit=false;return;}
        if (this.firing) {
            ctx.drawImage(textures[13],0,0,16,40,this.rect.getLeft(),this.rect.getTop(),64,160);
        } else {
            ctx.drawImage(textures[13],0,0,16,32,this.rect.getLeft(),this.rect.getTop(),64,128);
        }
        ctx.drawImage(textures[13],16,6*this.img,10,6,this.rect.getLeft()+12,this.rect.getTop()+64,40,24);
    }
    
    manageDeath() {
        entities.push(new MultiUp(this.rect.getCenterX(),this.rect.getCenterY()));
        openDoors();
    }
}

function openDoors() {
    for (var i=0; i<entities.length; i++) {
        if (entities[i].getAlignment()==4500) {
            entities[i].openDoor();
        }
    }
}

class LockDoor extends Entity {
    constructor(x,y,height) {
        super(x,y,20,height*20);
        this.height=height;
        this.renderHeight=0;
        this.open=false;
    }
    
    getAlignment() {
        return 4500;
    }
    
    update() {
        if (this.renderHeight<this.height&&!this.open) {
            this.renderHeight++;
        } else if (this.renderHeight>0&&this.open) {
            this.renderHeight--;
        }
        if (!this.open&&player.rect.intersects(this.rect)) {
            player.ejectFromRect(this.rect.getLeft(),this.rect.getTop(),this.rect.width,this.rect.height,[true,true,false,false]);
            player.hitWall(this.rect);
        }
    }
    
    openDoor() {
        this.open=true;
    }
    
    render(ctx) {
        if (this.renderHeight>0) {
            ctx.drawImage(textures[14],0,0,10,10,this.rect.getLeft(),this.rect.getTop(),20,20);
            for (var i=1; i<this.renderHeight; i++) {
                ctx.drawImage(textures[14],0,10,10,10,this.rect.getLeft(),this.rect.getTop()+20*i,20,20);
            }
            ctx.drawImage(textures[14],0,20,10,10,this.rect.getLeft(),this.rect.getTop()+this.renderHeight*20-20,20,20);
        }
    }
}

class Bomb extends Entity {
    constructor(x,y,dx,dy) {
        super(x,y,40,40);
        this.fuseTimer=0;
        this.hitTile=false;
        this.dx=dx;
        this.dy=dy;
        this.burning=false;
    }
    
    update() {
        this.hitTile=false;
        this.dy++;
        this.rect.translate(this.dx,Math.min(15,this.dy));
        if (this.burning) {
            this.fuseTimer++;
            if (this.fuseTimer>=240) {
                this.onScreen=false;
                for (var i=0; i<6; i++) {
                    entities.push(new BombDebris(this.rect.getCenterX(),this.rect.getCenterY(),Math.random()*8-4,Math.random()*-5-10));
                }
            }
        }
        if (this.hitboxIntersects(player)) {
            if (player.rect.getCenterX()<this.rect.getCenterX()) {
                this.dx=8;
            } else {
                this.dx=-8;
            }
            this.dy=-10;
        }
        this.ejectFromTerrain();
    }
    
    hitFloor(rect) {
        if (this.hitTile||this.dy<0) {return;}
        this.hitTile=true;
        if (this.dy>2) {
            this.dy*=-0.3;
        } else {
            this.dy=0;
        }
        this.dx*=0.5;
        this.burning=true;
    }
    
    hitWall(rect) {
        if (this.hitTile) {return;}
        this.hitTile=true;
        this.dx*=-1;
    }
    
    render(ctx) {
        ctx.drawImage(textures[15],0,0,20,20,this.rect.getLeft(),this.rect.getTop(),40,40);
        ctx.drawImage(textures[15],20,Math.floor(this.fuseTimer/48)*4,4,4,this.rect.getRight()-8,this.rect.getTop()-4,16,16);
    }
}

class BombDebris extends Entity {
    constructor(x,y,dx,dy) {
        super(x-15,y-20,30,20);
        this.dx=dx;
        this.dy=dy;
        if (this.dx>0) {
            this.dir=0;
        } else {
            this.dir=1;
        }
        this.dangerous=true;
    }
    
    getAlignment() {
        return 3;
    }
    
    update() {
        this.dy++;
        this.rect.translate(this.dx,this.dy);
        if (this.rect.getTop()>level.height*20) {
            this.onScreen=false;
        }
        if (this.dangerous) {
            for (var i=0; i<entities.length; i++) {
                if (entities[i].getAlignment()==2&&entities[i].hitboxIntersects(this)) {
                    entities[i].getHit(5);
                    this.dangerous=false;
                    break;
                }
            }
        }
    }
    
    render(ctx) {
        ctx.drawImage(textures[7],0,20*this.dir,30,20,this.rect.getLeft(),this.rect.getTop(),this.rect.width,this.rect.height);
    }
}

class BlockSwitch extends Entity {
    constructor(x,y,speed,active) {
        super(x,y,160,40);
        this.speed=160/speed;
        this.tickerX=0;
        if (active) {
            this.active=true;
        } else {
            this.active=false;
        }
    }
    
    update() {
        this.tickerX+=this.speed;
        if (this.tickerX==0) {
            if (this.active) {
                flipBlocks();
            }
        } else if (Math.abs(this.tickerX)>80) {
            this.speed*=-1;
        }
    }
    
    render(ctx) {
        ctx.drawImage(textures[17],this.rect.getLeft(),this.rect.getTop(),160,40);
        ctx.fillStyle="#fff";
        ctx.fillRect(this.tickerX+this.rect.getCenterX()-3,this.rect.getTop(),6,40);
    }
}