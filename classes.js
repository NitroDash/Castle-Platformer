var keys=[keyboard(38),keyboard(40),keyboard(37),keyboard(39),keyboard(90),keyboard(16),keyboard(88),keyboard(13)];
var tiles=[];
var TILEWIDTH=20;

function rangeRestrict(num,lower,upper) {
    return Math.max(Math.min(num,upper),lower);
}

function getTile(x,y,failResponse) {
    if (x>=0&&y>=0&&x<tiles.length&&y<tiles[0].length) {
        return tiles[x][y];
    } else {
        return failResponse;
    }
}

class Rectangle {
    constructor(x,y,width,height) {
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
    }
    
    moveTo(x,y) {
        this.x=x;
        this.y=y;
    }
    
    translate(dx,dy) {
        this.x+=dx;
        this.y+=dy;
    }
    
    getLeft() {
        return this.x;
    }
    
    getRight() {
        return this.x+this.width;
    }
    
    getTop() {
        return this.y;
    }
    
    getBottom() {
        return this.y+this.height;
    }
    
    getCenterX() {
        return this.x+this.width/2;
    }
    
    getCenterY() {
        return this.y+this.height/2;
    }
    
    getHorizOverlap(x,width) {
        return Math.max(0,Math.min(x+width-this.getLeft(),this.getRight()-x));
    }
    
    intersects(other) {
        return (this.getRight()>other.getLeft()&&this.getLeft()<other.getRight()&&this.getTop()<other.getBottom()&&this.getBottom()>other.getTop());
    }
}

class Entity {
    constructor(x,y,width,height) {
        this.rect=new Rectangle(x,y,width,height);
        this.hitbox=new Rectangle(0,0,width,height);
        this.dx=0;
        this.dy=0;
        this.onScreen=true;
        this.survivesScreenTransition=false;
    }
    
    hitboxIntersects(other) {
        this.hitbox.translate(this.rect.getLeft(),this.rect.getTop());
        other.hitbox.translate(other.rect.getLeft(),other.rect.getTop());
        var collide=this.hitbox.intersects(other.hitbox);
        this.hitbox.translate(-this.rect.getLeft(),-this.rect.getTop());
        other.hitbox.translate(-other.rect.getLeft(),-other.rect.getTop());
        return collide;
    }
    
    getAlignment() {
        return 0;//Neutral
    }
    
    getHit(damage) {
        
    }
    
    update() {
        
    }
    
    ejectFromWalls() {
        var x1=Math.floor(this.rect.getLeft()/TILEWIDTH);
        var x2=Math.floor(this.rect.getRight()/TILEWIDTH);
        for (var y=Math.floor(this.rect.getTop()/TILEWIDTH); y<=Math.floor((this.rect.getBottom()-1)/TILEWIDTH); y++) {
            if (getWall(getTile(x1,y,0),2)) {
                this.rect.translate(x1*TILEWIDTH+TILEWIDTH-this.rect.getLeft(),0);
                this.hitWall(new Rectangle(x1*TILEWIDTH,y*TILEWIDTH,TILEWIDTH,TILEWIDTH));
            }
            if (getWall(getTile(x2,y,0),3)) {
                this.rect.translate(x2*TILEWIDTH-this.rect.getRight(),0);
                this.hitWall(new Rectangle(x2*TILEWIDTH,y*TILEWIDTH,TILEWIDTH,TILEWIDTH));
            }
        }
    }
    
    ejectFromFloor() {
        var y=Math.floor(this.rect.getBottom()/TILEWIDTH);
        var foundFloor=false;
        for (var x=Math.floor(this.rect.getLeft()/TILEWIDTH); x<=Math.floor(this.rect.getRight()/TILEWIDTH); x++) {
            if (getWall(getTile(x,y,0),0)&&!getWall(getTile(x,y-1,0),0)&&this.rect.getBottom()-y*TILEWIDTH<this.rect.getHorizOverlap(x*TILEWIDTH,TILEWIDTH)) {
                this.rect.translate(0,y*TILEWIDTH-this.rect.getBottom());
                this.hitFloor(new Rectangle(x*TILEWIDTH,y*TILEWIDTH,TILEWIDTH,TILEWIDTH),0,0);
                foundFloor=true;
            }
        }
        if (!foundFloor) {
            this.ejectFromPlatforms();
        }
    }
    
    ejectFromPlatforms() {
        for (var i=0; i<entities.length; i++) {
            if (entities[i].getAlignment()==5) {
                if (this.rect.getHorizOverlap(entities[i].rect.getLeft(),entities[i].rect.width)>5&&Math.abs(this.rect.getBottom()-entities[i].rect.getTop())<9&&this.dy>=entities[i].dy) {
                    this.rect.translate(0,entities[i].rect.getTop()-this.rect.getBottom());
                    this.hitFloor(entities[i].rect,entities[i].getXVel(),entities[i].getYVel());
                }
            }
        }
    }
    
    ejectFromCeiling() {
        var y=Math.floor(this.rect.getTop()/TILEWIDTH);
        for (var x=Math.floor(this.rect.getLeft()/TILEWIDTH); x<=Math.floor(this.rect.getRight()/TILEWIDTH); x++) {
            if (getWall(getTile(x,y,0),1)&&!getWall(getTile(x,y+1,0),1)&&y*TILEWIDTH+TILEWIDTH-this.rect.getTop()<this.rect.getHorizOverlap(x*TILEWIDTH,TILEWIDTH)) {
                this.rect.translate(0,y*TILEWIDTH+TILEWIDTH-this.rect.getTop());
                this.hitCeiling(new Rectangle(x*TILEWIDTH,y*TILEWIDTH,TILEWIDTH,TILEWIDTH));
            }
        }
    }
    
    ejectFromRect(x,y,width,height,allowed) {
        if (!allowed) {
            allowed=[true,true,true,true];
        }
        var dists=[this.rect.getRight()-x,x+width-this.rect.getLeft(),this.rect.getBottom()-y,y+height-this.rect.getTop()];
        var smallestIndex=-1;
        for (var i=0; i<dists.length; i++) {
            if (allowed[i]&&dists[i]<Math.min(width,height)&&(smallestIndex==-1||dists[i]<dists[smallestIndex])) {
                smallestIndex=i;
            }
        }
        switch (smallestIndex) {
            case 0:
                this.rect.translate(-dists[0],0);
                break;
            case 1:
                this.rect.translate(dists[1],0);
                break;
            case 2:
                this.rect.translate(0,-dists[2]);
                break;
            case 3:
                this.rect.translate(0,dists[3]);
                break;
        }
    }
    
    ejectFromTerrain() {
        this.ejectFromFloor();
        this.ejectFromCeiling();
        this.ejectFromWalls();
    }
    
    hitFloor(rect) {}
    
    hitWall(rect) {}
    
    hitCeiling(rect) {}
    
    render(ctx) {
        ctx.fillStyle="green";
        ctx.fillRect(this.rect.x,this.rect.y,this.rect.width,this.rect.height);
    }
    
    getDamage() {
        return 0;
    }
    
    manageDeath() {}
    
    takeTerrainDamage() {
        var boundaries=[Math.floor(this.rect.getLeft()/TILEWIDTH),Math.floor(this.rect.getTop()/TILEWIDTH),Math.floor(this.rect.getRight()/TILEWIDTH),Math.floor(this.rect.getBottom()/TILEWIDTH)];
        for (var x=boundaries[0];x<=boundaries[2];x++) {
            for (var y=boundaries[1];y<=boundaries[3];y++) {
                if (getWall(getTile(x,y,0),4)) {
                    this.getHit(1);
                }
            }
        }
    }
}

class Player extends Entity{
    constructor(x,y,width,height) {
        super(x,y,width,height);
        this.grounded=false;
        this.wasGrounded=false;
        this.jumpTimer=0;
        this.moveSpeed=2;
        this.jumpSpeed=8;
        this.gravity=0.5;
        this.maxVertSpeed=15;
        this.dir=1;
        this.survivesScreenTransition=true;
        this.invincCounter=0;
        this.maxHP=6;
        this.hp=this.maxHP;
        this.lives=3;
    }
    
    getHit(damage) {
        if (this.invincCounter==0) {
            this.invincCounter=60;
            this.hp-=damage;
            updateHUD();
        }
    }
    
    getAlignment() {
        return 1;//Player
    }
    
    manageJumps() {
        if (this.grounded&&keys[0].isDown) {
            this.dy=-this.jumpSpeed;
        } else if (this.jumpTimer>0&&keys[0].isDown) {
            this.dy=-this.jumpSpeed;
            this.jumpTimer--;
        } else if (this.jumpTimer>0) {
            this.jumpTimer=0;
        }
    }
    
    manageLRMoves() {
        if (keys[2].isDown) {
            this.dx=-this.moveSpeed;
            this.dir=0;
        } else if (keys[3].isDown) {
            this.dx=this.moveSpeed;
            this.dir=1;
        } else {
            this.dx=0;
        }
    }
    
    update() {
        this.manageEnemies();
        this.manageJumps();
        this.manageLRMoves();
        this.moveAndAccelerate();
        this.rect.translate(this.dx,rangeRestrict(this.dy,-this.maxVertSpeed,this.maxVertSpeed));
        this.takeTerrainDamage();
        this.ejectFromTerrain();
        this.managePauses();
    }
    
    managePauses() {
        if (keys[7].isDown&&this.grounded) {
            pause();
        }
    }
    
    moveAndAccelerate() {
        this.dy+=this.gravity;
        this.wasGrounded=this.grounded;
        this.grounded=false;
        if (keys[5].isDown&&allowZipping) {
            if (keys[0].isDown) {
                this.rect.translate(0,-100);
            }
            if (keys[1].isDown) {
                this.rect.translate(0,100);
            }
            if (keys[2].isDown) {
                this.rect.translate(-100,0);
            }
            if (keys[3].isDown) {
                this.rect.translate(100,0);
            }
        }
    }
    
    hitFloor(rect,xVelocity,yVelocity) {
        this.grounded=true;
        this.dy=yVelocity;
        this.dx=xVelocity;
        this.rect.translate(this.dx,this.dy);
        this.jumpTimer=10;
    }
    
    hitCeiling(rect) {
        this.dy=0;
    }
    
    ejectFromFloor() {
        if (this.dy>=0) {
            super.ejectFromFloor();
        } else if (this.wasGrounded) {
            super.ejectFromPlatforms();
        }
    }
    
    ejectFromCeiling() {
        if (this.dy<=0) {
            super.ejectFromCeiling();
        }
    }
    
    getDirDX() {
        return this.dir==0 ? 1 : -1;
    }
    
    advanceWalk() {}
    
    manageEnemies() {
        if (this.invincCounter>0) {
            this.invincCounter--;
        } else {
            this.checkForEnemyHit();
        }
        this.checkForDropGrabs();
    }
    
    checkForEnemyHit() {
        for (var i=0; i<entities.length; i++) {
            if (entities[i].getAlignment()==2&&entities[i].hitboxIntersects(this)) {
                this.getHit(entities[i].getDamage());
                break;
            }
        }
    }
    
    checkForDropGrabs() {
        for (var i=0; i<entities.length; i++) {
            if (entities[i].getAlignment()==4&&entities[i].hitboxIntersects(this)) {
                entities[i].getCollectedBy(this);
                break;
            }
        }
    }
}

class Ninja extends Player {
    constructor(x,y) {
        super(x,y,80,80);
        this.hitbox.width=40;
        this.hitbox.moveTo(20,0);
        this.jumpSpeed=12;
        this.gravity=1;
        this.moveSpeed=5;
        this.onWall=false;
        this.wallJumpDir=0;
        this.image=0;
        this.animCounter=0;
        this.shurikenCooldown=0;
    }
    
    moveAndAccelerate() {
        super.moveAndAccelerate();
        if (this.onWall) {
            if (keys[0].isDown) {
                this.wallJumpDir=this.getDirDX()*20;
                this.dx=this.getDirDX()*this.moveSpeed;
                this.dy=-this.jumpSpeed;
                this.image=5;
            }
        } else {
            this.hitbox.moveTo(20,0);
        }
        this.onWall=false;
    }
    
    manageJumps() {
        if (this.shurikenCooldown==0) {
            super.manageJumps();
        } else {
            this.jumpTimer=0;
        }
    }
    
    manageLRMoves() {
        if (this.shurikenCooldown==0&&keys[4].isDown&&!this.onWall) {
            this.shurikenCooldown=25;
            entities.push(new Shuriken(this.rect.getCenterX(),this.rect.getCenterY(),this.getDirDX()*15,0));
            this.image=6;
        }
        if (this.shurikenCooldown>0) {
            this.shurikenCooldown--;
        }
        if (this.wallJumpDir==0) {
            if (keys[2].isDown&&(!this.grounded||this.shurikenCooldown==0)) {
                this.dx=-this.moveSpeed;
                if (!this.onWall) {
                    this.dir=1;
                }
                if (this.grounded) {
                    this.advanceWalk();
                }
            } else if (keys[3].isDown&&(!this.grounded||this.shurikenCooldown==0)) {
                this.dx=this.moveSpeed;
                if (!this.onWall) {
                    this.dir=0;
                }
                if (this.grounded) {
                    this.advanceWalk();
                }
            } else {
                this.dx=0;
                if (this.grounded&&this.shurikenCooldown==0) {
                    this.advanceStand();
                }
            }
        } else if (this.wallJumpDir>0){
            this.wallJumpDir--;
        } else {
            this.wallJumpDir++;
        }
        if (!this.onWall&&!this.grounded&&this.shurikenCooldown==0) {
            this.image=5;
        }
    }
    
    hitWall(rect) {
        if (this.dy>0&&!this.grounded&&((this.rect.getLeft()<rect.getLeft()&&keys[3].isDown)||(this.rect.getLeft()>rect.getLeft()&&keys[2].isDown))) {
            this.onWall=true;
            this.dy=0;
            this.dir=(this.rect.getLeft()<rect.getLeft())?1:0;
            if (this.dir==1) {
                this.hitbox.moveTo(this.hitbox.width,0);
            } else {
                this.hitbox.moveTo(0,0);
            }
            this.image=4;
        }
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        if (this.invincCounter%30<15) {
            ctx.drawImage(textures[1],this.image*40,this.dir*40,40,40,this.rect.getLeft(),this.rect.getTop(),this.rect.width,this.rect.height);
        }
    }
    
    advanceWalk() {
        if (this.animCounter<0) {
            this.animCounter--;
            if (this.animCounter<=-30) {
                this.animCounter=-1;
            }
        } else {
            this.animCounter=-1;
        }
        this.image=(this.animCounter<-15)?3:2;
    }
    
    advanceStand() {
        if (this.animCounter>=0) {
            this.animCounter++;
            if (this.animCounter>=60) {
                this.animCounter=0;
            }
        } else {
            this.animCounter=0;
        }
        this.image=(this.animCounter>30)?1:0;
    }
}

class Shuriken extends Entity {
    constructor(x,y,dx,dy) {
        super(x,y,12,12);
        this.dx=dx;
        this.dy=dy;
        this.animCounter=0;
        this.image=0;
        this.despawnCounter=0;
    }
    
    getAlignment() {
        return 3;//Player-affiliated projectile
    }
    
    update() {
        if (this.despawnCounter>0) {
            this.despawnCounter++;
            if (this.despawnCounter>360) {
                this.onScreen=false;
            }
        } else {
            this.animCounter++;
            if (this.animCounter>6) {
                this.image=0;
                this.animCounter=0;
            } else if (this.animCounter>3) {
                this.image=1;
            }
            this.rect.translate(this.dx,this.dy);
            if (this.dx>0) {
                if (getWall(getTile(Math.floor(this.rect.getRight()/TILEWIDTH),Math.floor(this.rect.getCenterY()/TILEWIDTH),0),3)) {
                    this.despawnCounter=1;
                    this.rect.translate(-(this.rect.getRight()%TILEWIDTH),0);
                }
            } else {
                if (getWall(getTile(Math.floor(this.rect.getLeft()/TILEWIDTH),Math.floor(this.rect.getCenterY()/TILEWIDTH),0),2)) {
                    this.despawnCounter=1;
                    this.rect.translate(20-this.rect.getLeft()%TILEWIDTH,0);
                }
            }
            if (this.dy>0) {
                if (getWall(getTile(Math.floor(this.rect.getCenterX()/TILEWIDTH),Math.floor(this.rect.getBottom()/TILEWIDTH),0),0)) {
                    this.despawnCounter=1;
                    this.rect.translate(0,-(this.rect.getBottom()%TILEWIDTH));
                }
            } else if (this.dy<0) {
                if (getWall(getTile(Math.floor(this.rect.getCenterX()/TILEWIDTH),Math.floor(this.rect.getTop()/TILEWIDTH),0),1)) {
                    this.despawnCounter=1;
                    this.rect.translate(0,20-(this.rect.getTop()%TILEWIDTH));
                }
            }
            if (this.rect.getRight()<0||this.rect.getLeft()>tiles.length*TILEWIDTH||this.rect.getTop()<0||this.rect.getBottom()>tiles[0].length*TILEWIDTH) {
                this.onScreen=false;
            }
            for (var i=0; i<entities.length; i++) {
                if (entities[i].getAlignment()==2&&entities[i].rect.intersects(this.rect)) {
                    entities[i].getHit(this.getDamage());
                    this.onScreen=false;
                }
            }
        }
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        ctx.drawImage(textures[2],this.image*3,0,3,3,this.rect.getLeft(),this.rect.getTop(),12,12);
    }
    
    getDamage() {
        return 5;
    }
}

class MovingPlatform extends Entity {
    constructor(x,y,x2,y2,speed) {
        super(x,y,100,7);
        this.p1={"x":x,"y":y};
        this.p2={"x":x2,"y":y2};
        this.dest=2;
        this.speed=speed;
        this.setVel(this.p2);
    }
    
    moveToward(p) {
        this.rect.translate(this.dx,this.dy);
    }
    
    setVel(p) {
        var disp={"x":p.x-this.rect.getLeft(),"y":p.y-this.rect.getTop()};
        var dispMag=Math.sqrt(disp.x*disp.x+disp.y*disp.y);
        this.dx=disp.x*this.speed/dispMag;
        this.dy=disp.y*this.speed/dispMag;
    }
    
    distTo(p) {
        return Math.sqrt(Math.pow(this.rect.getLeft()-p.x,2)+Math.pow(this.rect.getTop()-p.y,2));
    }
    
    update() {
        if (this.dest==1) {
            this.moveToward(this.p1);
            if (this.distTo(this.p1)<=this.speed) {
                this.dest=2;
                this.setVel(this.p2);
            }
        } else {
            this.moveToward(this.p2);
            if (this.distTo(this.p2)<=this.speed) {
                this.dest=1;
                this.setVel(this.p1);
            }
        }
    }
    
    render(ctx) {
        ctx.drawImage(textures[9],this.rect.getLeft(),this.rect.getTop());
    }
    
    getAlignment() {
        return 5;//Platform
    }
    
    getXVel() {
        return this.dx;
    }
    
    getYVel() {
        return this.dy;
    }
}

class Jetpacker extends Player {
    constructor(x,y) {
        super(x,y,60,80);
        this.jumpSpeed=9;
        this.gravity=0.8;
        this.moveSpeed=4;
        this.walkAccel=1;
        this.jetPackAccel=1.2;
        this.image=0;
        this.walkAnimCounter=15;
        this.smokeCounter=0;
    }
    
    manageLRMoves() {
        var speed=this.moveSpeed;
        if (!this.grounded) {
            speed*=0.1;
        }
        if (keys[2].isDown) {
            this.dx=Math.max(-this.moveSpeed,this.dx-speed);
            this.dir=1;
            this.advanceWalk();
        } else if (keys[3].isDown) {
            this.dx=Math.min(this.moveSpeed,this.dx+speed);
            this.dir=0;
            this.advanceWalk();
        } else {
            this.image=0;
        }
        if (keys[4].isDown) {
            this.smokeCounter++;
            if (this.smokeCounter>=4) {
                this.smokeCounter=0;
                entities.push(new JetpackSmoke((this.dir==1?this.rect.getCenterX():this.rect.getLeft()),this.rect.getBottom()));
            }
            if (this.dy>-this.maxVertSpeed/2) {
                this.dy-=this.jetPackAccel;
            }
            if (keys[2].isDown) {
                this.dx=Math.max(-this.moveSpeed,this.dx-this.jetPackAccel/2);
            }
            if (keys[3].isDown) {
                this.dx=Math.min(this.moveSpeed,this.dx+this.jetPackAccel/2);
            }
        }
    }
    
    advanceWalk() {
        if (this.grounded) {
            this.walkAnimCounter++;
            if (this.walkAnimCounter>=30) {
                this.walkAnimCounter=0;
            }
            this.image=Math.floor(this.walkAnimCounter/15);
        } else {
            this.image=0;
            this.walkAnimCounter=15;
        }
    }
    
    moveAndAccelerate() {
        super.moveAndAccelerate();
        if (!this.grounded) {
            this.dx*=0.995;
        }
    }
    
    hitWall(rect) {
        this.dx*=-1;
    }
    
    hitCeiling(rect) {
        this.dy=Math.abs(this.dy);
    }
    
    hitFloor(rect,xVelocity,yVelocity) {
        this.grounded=true;
        this.dy=yVelocity;
        this.dx=(3*this.dx+xVelocity)*0.25;
        this.rect.translate(0,this.dy);
        this.jumpTimer=10;
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        if (this.invincCounter%30<15) {
            ctx.drawImage(textures[1],40*this.image,40*this.dir,40,40,this.rect.getLeft()-10,this.rect.getTop(),80,this.rect.height);
        }
    }
}

class JetpackSmoke extends Entity {
    constructor(x,y) {
        super(x,y,0,0);
        this.animCounter=0;
        this.image=0;
    }
    
    update() {
        this.rect.translate(0,5);
        this.animCounter++;
        if (this.animCounter>=20) {
            this.onScreen=false;
        } else if (this.animCounter%5==0) {
            this.image++;
        }
    }
    
    render(ctx) {
        ctx.drawImage(textures[2],this.image*20,0,20,20,this.rect.getLeft(),this.rect.getTop(),40,40);
    }
}

class Portaler extends Player {
    constructor(x,y) {
        super(x,y,80,60);
        this.jumpSpeed=9;
        this.gravity=0.8;
        this.moveSpeed=4;
        this.walkAccel=1;
        this.image=0;
        this.walkAnimCounter=15;
        this.hitbox.width=40;
        this.hitbox.x=20;
        this.warpCooldown=0;
        this.lastWarp=0;
    }
    
    update() {
        this.managePortals();
        super.update();
    }
    
    managePortals() {
        if (this.warpCooldown>0) {
            this.warpCooldown--;
        }
        for (var i=0; i<entities.length; i++) {
            if (entities[i].getAlignment()==800&&entities[i].state==1&&entities[i].rect.intersects(this.rect)&&(this.dx*(entities[i].rect.getCenterX()-this.rect.getCenterX())+(this.grounded?0:this.dy)*(entities[i].rect.getCenterY()-this.rect.getCenterY()))>=0) {
                if (this.warpCooldown==0||entities[i].color!=this.lastWarp) {
                    for (var j=0; j<entities.length; j++) {
                        if (entities[j].color==1-entities[i].color&&entities[j].state==1) {
                            this.warpTo(entities[j]);
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }
    
    warpTo(portal) {
        this.rect.moveTo(portal.getWarpedX()-this.rect.width/2,portal.getWarpedY()-this.rect.height/2);
        var velMag=Math.min(Math.sqrt(this.dx*this.dx+this.dy*this.dy),this.maxVertSpeed);
        var theta=portal.getWarpedTheta();
        this.dx=velMag*Math.cos(theta);
        this.dy=velMag*Math.sin(theta);
        this.warpCooldown=15;
        this.lastWarp=portal.color;
    }
    
    manageLRMoves() {
        var speed=this.moveSpeed;
        if (!this.grounded) {
            speed*=0.05;
        }
        if (keys[2].isDown&&!keys[1].isDown) {
            this.dx-=speed;
            if (this.grounded) {
                this.dx=Math.max(-this.moveSpeed,this.dx);
            }
            this.dir=1;
            this.advanceWalk();
        } else if (keys[3].isDown&&!keys[1].isDown) {
            this.dx+=speed;
            if (this.grounded) {
                this.dx=Math.min(this.moveSpeed,this.dx);
            }
            this.dir=0;
            this.advanceWalk();
        } else {
            this.image=0;
        }
        this.dx*=0.95;
        
        if (keys[0].isDown) {
            this.image=3;
        }
        
        if (keys[1].isDown) {
            this.image=4;
        }
        
        if (keys[4].isDown) {
            keys[4].isDown=false;
            this.firePortal(0);
        }
        if (keys[6].isDown) {
            keys[6].isDown=false;
            this.firePortal(1);
        }
    }
    
    firePortal(color) {
        var dx=0;
        var dy=0;
        if (keys[0].isDown) {
            dy=-1;
        } else if (keys[1].isDown) {
            dy=1;
        } else if (keys[2].isDown) {
            dx=-1;
        } else if (keys[3].isDown) {
            dx=1;
        } else {
            dx=1-this.dir*2;
        }
        entities.push(new Portal(this.rect.getCenterX(),this.rect.getCenterY(),dx*10,dy*10,color));
    }
    
    advanceWalk() {
        if (this.grounded) {
            this.walkAnimCounter++;
            if (this.walkAnimCounter>=30) {
                this.walkAnimCounter=0;
            }
            this.image=1+Math.floor(this.walkAnimCounter/15);
        } else {
            this.image=0;
            this.walkAnimCounter=15;
        }
    }
    
    hitFloor(rect,xVelocity,yVelocity) {
        this.grounded=true;
        this.dy=yVelocity;
        this.dx=(3*this.dx+xVelocity)*0.25;
        this.rect.translate(0,this.dy);
        this.jumpTimer=10;
    }
    
    render(ctx) {
        if (renderHitboxes) {
            ctx.fillStyle="red";
            ctx.fillRect(this.rect.getLeft()+this.hitbox.getLeft(),this.rect.getTop()+this.hitbox.getTop(),this.hitbox.width,this.hitbox.height);
        }
        if (this.invincCounter%30<15) {
            ctx.drawImage(textures[1],40*this.image,40*this.dir,40,40,this.rect.getLeft(),this.rect.getTop()-20,80,80);
        }
    }
}

class Portal extends Entity {
    constructor(x,y,dx,dy,color) {
        super(x-20,y-20,40,40);
        this.dx=dx;
        this.dy=dy;
        this.state=0;
        this.img=0;
        this.color=color;
        this.latchedPos={"x":0,"y":0};
        this.platform=null;
        this.platformOffset={"x":0,"y":0};
    }
    
    getAlignment() {
        return 800;//Portal
    }
    
    update() {
        if (this.state==0) {
            this.rect.translate(this.dx,this.dy);
            if (this.rect.getRight()<0||this.rect.getLeft()>level.width*20||this.rect.getBottom()<0||this.rect.getTop()>level.height*20) {
                this.onScreen=false;
            }
            for (var i=0; i<entities.length; i++) {
                if (entities[i].getAlignment()==400&&this.rect.intersects(entities[i].rect)) {
                    this.onScreen=false;
                    break;
                }
            }
            this.ejectFromTerrain();
        } else if (this.platform!=null) {
            this.rect.moveTo(this.platform.rect.getLeft()+this.platformOffset.x,this.platform.rect.getTop()+this.platformOffset.y);
        }
    }
    
    ejectFromTerrain() {
        if (this.dy<0) {
            this.ejectFromCeiling();
        } else if (this.dy>0){
            this.ejectFromFloor();
        }
        this.ejectFromWalls();
        if (this.latchedPos.x!=0||this.latchedPos.y!=0) {
            this.rect.moveTo(this.latchedPos.x,this.latchedPos.y);
            this.purgePortals(this.color);
        }
    }
    
    hitWall(rect) {
        if (this.state!=0) {return;}
        if (rect.getLeft()<this.rect.getLeft()) {
            this.latchedPos.x=rect.getRight()-20;
            this.latchedPos.y=this.rect.getTop();
            this.img=3;
        } else {
            this.latchedPos.x=rect.getLeft()-20;
            this.latchedPos.y=this.rect.getTop();
            this.img=4;
        }
        this.state=1;
    }
    
    hitCeiling(rect) {
        if (this.state!=0) {return;}
        this.latchedPos.x=this.rect.getLeft();
        this.latchedPos.y=rect.getBottom()-20;
        this.img=1;
        this.state=1;
    }
    
    hitFloor(rect,xVelocity,yVelocity) {
        if (this.state!=0) {return;}
        this.latchedPos.x=this.rect.getLeft();
        this.latchedPos.y=rect.getTop()-20;
        if (xVelocity!=0||yVelocity!=0) {
            for (var i=0; i<entities.length; i++) {
                if (entities[i].getAlignment()==5&&entities[i].rect.intersects(this.rect)) {
                    this.platform=entities[i];
                    this.platformOffset.x=this.latchedPos.x-this.platform.rect.getLeft();
                    this.platformOffset.y=this.latchedPos.y-this.platform.rect.getTop();
                    break;
                }
            }
        }
        this.img=2;
        this.state=1;
    }
    
    render(ctx) {
        ctx.drawImage(textures[2],40*this.img,40*this.color,40,40,this.rect.getLeft()-20,this.rect.getTop()-20,80,80);
    }
    
    purgePortals(color) {
        for (var i=0; i<entities.length; i++) {
            if (entities[i].color==color&&entities[i].state==1&&entities[i]!=this) {
                entities[i].onScreen=false;
            }
        }
    }
    
    getWarpedX() {
        if (this.img==3) {
            return this.rect.getRight()+40;
        } else if (this.img==4) {
            return this.rect.getLeft()-40;
        } else {
            return this.rect.getCenterX();
        }
    }
    
    getWarpedY() {
        if (this.img==1) {
            return this.rect.getBottom()+30;
        } else if (this.img==2) {
            return this.rect.getTop()-30;
        } else {
            return this.rect.getCenterY();
        }
    }
    
    getWarpedTheta() {
        if (this.img==1) {
            return Math.PI/2;
        } else if (this.img==2) {
            return -Math.PI/2;
        } else if (this.img==3) {
            return 0;
        } else {
            return Math.PI;
        }
    }
}