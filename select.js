function setupSelect() {
    var canvas=document.getElementById("canvas");
    ctx=canvas.getContext("2d");
    ctx.font="30px Verdana";
    ctx.imageSmoothingEnabled=false;
    keys[2].onPress=function() {
        playerCharacter+=2;
        playerCharacter%=3;
        redraw();
    }
    keys[3].onPress=function() {
        playerCharacter++;
        playerCharacter%=3;
        redraw();
    }
    keys[4].onPress=function() {
        keys[2].onPress=null;
        keys[3].onPress=null;
        keys[4].onPress=null;
        load();
    }
    redraw();
}

function redraw() {
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,800,600);
    for (var i=0; i<3; i++) {
        if (playerCharacter==i) {
            ctx.fillStyle="#f00";
        } else {
            ctx.fillStyle="#aaa";
        }
        ctx.fillRect(i*150+200,250,100,100);
        ctx.drawImage(textures[i+1],0,0,40,40,i*150+210,260,80,80);
    }
}