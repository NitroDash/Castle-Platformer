class Drop extends Entity {
    constructor(x,y,width,height) {
        super(x,y,width,height);
        this.falls=false;
        this.dy=0;
    }
    
    getAlignment() {
        return 4;//Drop
    }
    
    update() {
        if (this.falls) {
            this.dy+=0.5;
            if (this.dy>15) {
                this.dy=15;
            }
            this.rect.translate(0,this.dy);
            this.ejectFromFloor();
            this.ejectFromWalls();
        }
    }
    
    hitFloor() {
        this.dy=0;
    }
    
    getCollectedBy(other) {};
}

class Heart extends Drop {
    constructor(x,y) {
        super(x,y,20,20);
        this.falls=true;
    }
    
    render(ctx) {
        ctx.drawImage(textures[16],0,0,20,20,this.rect.getLeft(),this.rect.getTop(),20,20);
    }
    
    getCollectedBy(other) {
        if (other.hp<other.maxHP) {
            other.hp++;
        }
        this.onScreen=false;
        updateHUD();
    }
}

class OneUp extends Drop {
    constructor(x,y) {
        super(x-20,y-20,40,40);
        if (roomCoords[world][level.worldCoords.x+Math.floor(this.rect.getCenterX()/800)][level.worldCoords.y+Math.floor(this.rect.getCenterY()/600)]<0) {
            this.onScreen=false;
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
    }
    
    render(ctx) {
        if (this.onScreen) {
            ctx.drawImage(textures[3],this.img*40,0,40,40,this.rect.getLeft(),this.rect.getTop(),40,40);
        }
    }
    
    getCollectedBy(other) {
        other.lives++;
        numBalls++;
        this.onScreen=false;
        roomCoords[world][level.worldCoords.x+Math.floor(this.rect.getCenterX()/800)][level.worldCoords.y+Math.floor(this.rect.getCenterY()/600)]*=-1;
        updateHUD();
    }
}

class MultiUp extends OneUp {
    constructor(x,y) {
        super(x-20,y);
        this.rect.width=80;
    }
    
    render(ctx) {
        if (this.onScreen) {
            ctx.drawImage(textures[3],this.img*40,0,40,40,this.rect.getLeft(),this.rect.getTop(),40,40);
            ctx.drawImage(textures[3],this.img*40,0,40,40,this.rect.getCenterX(),this.rect.getTop(),40,40);
        }
    }
    
    getCollectedBy(other) {
        other.lives++;
        numBalls+=2;
        this.onScreen=false;
        for (var x=0; x<level.width/40; x++) {
            for (var y=0; y<level.height/30; y++) {
                roomCoords[world][level.worldCoords.x+x][level.worldCoords.y+y]*=-1;
            }
        }
        updateHUD();
    }
}