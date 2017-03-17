var Trivial = {};

Trivial.Preloader = function () {};

Trivial.Preloader.prototype = {
    init: function () {
        this.input.maxPointers = 1;
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        //this.scale.pageAlignVertically = true;
        
        this.time.desiredFps = 60;
    },

    preload: function () {
        //  Load the Google WebFont Loader script
        this.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
        
        this.load.json("questions", "/db/preguntas.json");
        
        this.load.path = 'assets/';
        this.load.image("hero", "astro.png");
        this.load.images(["btn_white", "btn_blue"]);
        this.load.spritesheet('casillas', 'casillas.png', 45, 45);
        this.load.spritesheet('efecto', 'uncover_tile.png', 45, 45);
        this.load.spritesheet("dado", "dice.png", 64, 64);
    },

    create: function () {
        this.state.start('Trivial.Game');
    }
};

Trivial.Game = function () {
    this.BLINK_TIME = 250;
    this.HERO_VEL   = 250;
    this.BOARD = [
        0, 1, 2, 3, 4, 1, 2,
        0, 2, 3, 4, 2, 3, 4,
        0, 4, 3, 1, 4, 2, 3,
        0, 3, 1, 4, 3, 2, 1
    ];
    
    this.hero = null;
    this.heroPos = 3;
    this.heroTarget = 0;
    this.lockKeys = true;
    this.route1 = {route: [], dist: []};
    this.route2 = {route: [], dist: []};
    
    this.dice = null;
    this.boardTiles = null;
    this.heroLayer = null;
    this.logicBoard = [];
    this.btnBlue = null;
    this.btnWhite = null;

    this.blinkTimer = null;
    this.blinkValue = false;
    
    this.debugKey = null;
    this.showDebug = false;
};

Trivial.Game.prototype = {
    init: function () {
        this.blinkTimer = this.time.create();
        this.blinkTimer.loop(this.BLINK_TIME, this.doBlinkTiles, this);
        this.blinkTimer.start();
    },

    create: function () {
        this.stage.backgroundColor = 0x000000;
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // questions
        this.questions = this.cache.getJSON("questions").questions;
        console.log("questions loaded:", this.questions);

        // board
        this.boardTiles = this.add.group();
        this.heroLayer = this.add.group();
        this.logicBoard = [];
        this.boardList = new Phaser.ArraySet();
        for (var q=0;q<8;q++) {
            var type = (q == 7)?1:(q>0)?4:0;
            var tile = this.add.sprite(q*45, 100, "casillas", type*4, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
            this.boardList.add(tile);
        }
        for (q=0;q<6;q++) {
            tile = this.add.sprite(7*45, 134+(q*34), "casillas", 16, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
            this.boardList.add(tile);
        }
        for (q=8;q--;) {
            type = (q == 7)?2:(q>0)?4:3;
            tile = this.add.sprite(q*45, 134+(6*34), "casillas", type*4, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
            this.boardList.add(tile);
        }
        for (q=6;q--;) {
            tile = this.add.sprite(0, 134+(q*34), "casillas", 16, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
            this.boardList.add(tile);
        }
        
        // hero
        this.heroPos = this.rnd.between(0, this.logicBoard.length-1);
        console.log(this.heroPos, Math.floor(this.heroPos/7));
        var pos = this.getPosForTile(this.heroPos);
        this.heroTarget = this.heroPos;
        this.hero = this.add.sprite(pos.x, pos.y, "hero", 0, this.heroLayer);
        this.hero.anchor.setTo(0.5, 1);
        this.game.physics.arcade.enable(this.hero);
        this.hero.enableBody = true;
        this.hero.body.width = 30;
        this.hero.body.height = 10;
        this.hero.body.offset.setTo(10, 80);
        this.lockKeys = true;
        
        // buttons
        this.btnBlue = this.add.button(80, 370, "btn_blue", this.onBtnPress, this);
        this.btnWhite = this.add.button(180, 370, "btn_white", this.onBtnPress, this);
        console.log(this.btnBlue);
        
        // launch sample dice
        this.launchDice();

        //  Press D to toggle the debug display
        this.debugKey = this.input.keyboard.addKey(Phaser.Keyboard.D);
        this.debugKey.onUp.add(this.toggleDebug, this);
    },
    
    update: function () {
        this.boardTiles.sort('y', Phaser.Group.SORT_ASCENDING);
        this.heroLayer.sort('y', Phaser.Group.SORT_ASCENDING);
        
        // to-do: eliminar este bucle tan exigente
        this.boardTiles.forEach(function(t) {
            if (!t.blinking) t.frame = t.initialFrame;
        }, this);
        // to-do: eliminar este bucle tan exigente        
        this.game.physics.arcade.overlap(this.hero, this.boardTiles, this.heroOverlapsTile, null, this);
        
        if (this.lockKeys) {            
          
        }
    },

    render: function () {
        if (this.showDebug) {
            this.game.debug.text("Debug ON", 32, 32);
            this.game.debug.body(this.hero, "#ff0000", false);
            this.boardTiles.forEach(function(t) {
                this.game.debug.body(t, "#ffcc00", false);
            }, this);
        }
    },
    
    askQuestion: function() {
        var question = Phaser.ArrayUtils.shuffle(this.questions)[0];
        var answer = question["answers"][0];
        var options = Phaser.ArrayUtils.shuffle(question["answers"]);
        var qText = question["text"];
        console.log("Pregunta:", qText);
        console.log("opciones:", options);
        console.log("respuesta correcta: ", answer);
        
        var style = {
            font: "Press Start 2P", 
            fontSize: 9,
            fill: "yellow",
            stroke: "grey",
            strokeThickness: 0.2,
            align: "center", 
            wordWrap: true, 
            wordWrapWidth: 240
        };
        var text = this.add.text(game.world.centerX, 150, qText, style);
        text.anchor.setTo(0.5);
    },
    
    // custom methods
    blink: function(tile) {
        if (tile.blinking) {
            if (this.blinkValue) {
                if (tile.blinking == "left" && tile.frame%4 == 0) {
                    tile.frame = tile.initialFrame + 1;
                } else {
                    tile.frame = tile.initialFrame;
                }
            } else {
                if (tile.blinking == "right" && tile.frame%4 == 0) {
                    tile.frame = tile.initialFrame + 2;
                } else {
                    tile.frame = tile.initialFrame;
                }                
            }
        }
    },
    
    calculateTargetsFor: function(currPos) {
        this.tgt2 = currPos - this.dice;
        this.route2.route = [];
        this.route2.dist = [];
        if (this.tgt2 < 0) {
            this.tgt2 = this.logicBoard.length + this.tgt2;
            if (currPos > 0) {
                this.route2.route.push(0);
                this.route2.dist.push(currPos);
                this.route2.dist.push(Math.abs(this.tgt2-this.logicBoard.length));
            } else {
                this.route2.dist.push(this.dice);                
            }
        } else {
            var corner2 = false;
            if (this.tgt2 < 7 && currPos > 7) {
                this.route2.route.push(7);
                this.route2.dist.push(currPos-7);
                this.route2.dist.push(Math.abs(this.tgt2-7));
                corner2 = true;
            }
            if (this.tgt2 < 14 && currPos > 14) {
                this.route2.route.push(14);
                this.route2.dist.push(currPos-14);
                this.route2.dist.push(Math.abs(this.tgt2-14));
                corner2 = true;
            }
            if (this.tgt2 < 21 && currPos > 21) {
                this.route2.route.push(21);
                this.route2.dist.push(currPos-21);
                this.route2.dist.push(Math.abs(this.tgt2-21));
                corner2 = true;
            }
            if (!corner2) this.route2.dist.push(this.dice);
        }
        this.route2.route.push(this.tgt2);
        
        this.tgt1 = currPos + this.dice;
        this.route1.route = [];
        this.route1.dist = [];
        if (this.tgt1 >= this.logicBoard.length) {
            this.tgt1 = this.tgt1 - this.logicBoard.length;
            if (currPos > 21) {
                this.route1.route.push(0);
                this.route1.dist.push(Math.abs(currPos-this.logicBoard.length));
                this.route1.dist.push(this.tgt1);
            } else {
                this.route1.dist.push(this.dice);                
            }
        } else {
            var corner1 = false;
            if (this.tgt1 > 7 && currPos < 7) {
                this.route1.route.push(7);
                this.route1.dist.push(7-currPos);
                this.route1.dist.push(Math.abs(this.tgt1-7));
                corner1 = true;
            }
            if (this.tgt1 > 14 && currPos < 14) {
                this.route1.route.push(14);
                this.route1.dist.push(14-currPos);
                this.route1.dist.push(Math.abs(this.tgt1-14));
                corner1 = true;
            }
            if (this.tgt1 > 21 && currPos < 21) {
                this.route1.route.push(21);
                this.route1.dist.push(21-currPos);
                this.route1.dist.push(Math.abs(this.tgt1-21));
                corner1 = true;
            }
            if (!corner1) this.route1.dist.push(this.dice);
        }
        this.route1.route.push(this.tgt1);
        
        this.clearBlinks();
        this.logicBoard[this.tgt1].blinking = "left";
        this.logicBoard[this.tgt2].blinking = "right";
        
        console.log("r1:", this.route1);
        console.log("r2:", this.route2);
    },
    
    clearBlinks: function() {
        this.boardTiles.forEach(function(t) {
            t.frame = t.frame - t.frame%4;
            delete t.blinking;
        }, this);
    },
    
    createEffectAt: function(x, y) {
        var efecto = this.add.sprite(x, y, "efecto", 29, this.heroLayer);
        efecto.anchor.setTo(0.5, 1);
        efecto.animations.add("uncover", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], 30);
        efecto.animations.play("uncover", null, false, true);
    },

    discoverTileAndTweenHero: function(which, tweenHeroDirection) {
        var tileValue = this.BOARD[which];
        var isCornerTile = tileValue == 0||tileValue == 7||tileValue == 14||tileValue == 21;
        
        if (isCornerTile || this.logicBoard[which].initialFrame == (4+tileValue)*4) {
            this.tweenHero(tweenHeroDirection);
            return;
        } else {
            var pos = this.getPosForTile(which);
            this.createEffectAt(pos.x, pos.y+10);
            var uncoverTime = this.time.create(true);
            uncoverTime.add(500, function() {
                if (tileValue > 0) {
                    this.logicBoard[which].initialFrame = (4+tileValue)*4;
                }                
                this.tweenHero(tweenHeroDirection);
            }, this);  
            uncoverTime.start();
        }        
    },
    
    doBlinkTiles: function() {
        this.blinkValue = this.blinkValue ? false : true;
        this.boardTiles.forEach(this.blink, this);
    },
    
    endHeroMovement: function() {
        //this.lockKeys = false;
        this.updateHeroPos(this.heroTarget);
        this.askQuestion();
        //this.launchDice();
    },
    
    getPosForTile: function(boardTile) {
        return new Phaser.Point (
            22 + this.logicBoard[boardTile].x,
            -5 + this.logicBoard[boardTile].y
        );
    },   
    
    heroOverlapsTile: function(hero, tile) {
        tile.frame = tile.initialFrame + 3;
    },
    
    incrementIdxTest: function() {
        this.idxTest ++;
        this.idxTest = (this.idxTest < this.logicBoard.length) ? this.idxTest : 0;
    },
    
    launchDice: function() {
        this.lockKeys = true;
        
        this.dice = this.rnd.between(1, 6);
        console.log("launched dice: ", this.dice);
        
        var anim = Phaser.ArrayUtils.shuffle([0,1,2,3,4,5,0,1,2,3,4,5]);
        var roll = this.add.sprite(180, 460, "dado", 0, this.heroLayer);
        roll.anchor.setTo(0.5);
        roll.animations.add("end", [this.dice-1], 0);
        roll.animations.add("roll", anim, 20).onComplete.addOnce(function(spr, ani) {
            console.log("complete roll dice anim", spr, ani);
            roll.animations.play("end");
            this.markTargets();
        }, this);
        roll.animations.play("roll", null, false);
    },
    
    markTargets: function() {
        //mark the two available targets
        this.calculateTargetsFor(this.heroPos);
        this.blinkTimer.resume();
        this.lockKeys = false;
    },

    onBtnPress: function(btn) {
        console.log("lock keys:", this.lockKeys);
        if (this.lockKeys) return;
        if (btn.key == "btn_blue") {
            this.heroTarget = this.tgt2;
            this.discoverTileAndTweenHero(this.heroTarget, false);
            //this.tweenHero(false);
        } else if (btn.key == "btn_white") {
            this.heroTarget = this.tgt1;
            this.discoverTileAndTweenHero(this.heroTarget, true);
            //this.tweenHero(true);
        }
        this.lockKeys = true;
        this.blinkTimer.pause();
        this.clearBlinks();
    },
    
    onTileOverlap: function(img) {
        console.log(arguments);
        console.log(img.overlap(this.hero));
    },
    
    tweenHero: function(clockwise) {
        var route = clockwise ? this.route1 : this.route2;
        var tile1 = route.route.shift();
        var dest1 = this.getPosForTile(tile1);
        var distance1 = route.dist.shift();
        console.log("going to:", tile1, dest1, distance1);
        tween1 = this.add.tween(this.hero).to(
            {
                x: dest1.x,
                y: dest1.y,
            }, 
            this.HERO_VEL * distance1,
            null,
            true
        );
        tween1.onComplete.addOnce(function() {
            console.log("complete tween ONE!", arguments);
            if (route.route.length) {
                var tile2 = route.route.shift();
                var dest2 = this.getPosForTile(tile2);
                var distance2 = route.dist.shift();
                console.log("now going to:", tile2, dest2, distance2);
                tween2 = this.add.tween(this.hero).to(
                    {
                        x: dest2.x,
                        y: dest2.y
                    }, 
                    this.HERO_VEL * distance2,
                    null,
                    true
                );
                tween2.onComplete.addOnce(function() {
                    console.log("complete tween TWO!", arguments);
                    this.endHeroMovement();
                }, this);
            } else {
                console.log("NO tween TWO!", arguments);
                this.endHeroMovement();
            }
        }, this);
    },
    
    toggleDebug: function () {
        this.game.debug.reset();
        this.showDebug = this.showDebug ? false : true;
    },
    
    updateHeroPos: function(newPos) {
        this.heroPos = newPos;
        var coords = this.getPosForTile(this.heroPos);
        console.log(this.heroPos, Math.floor(this.heroPos/7));
        this.hero.x = coords.x;
        this.hero.y = coords.y;
    }
};

var game = new Phaser.Game(360, 640, Phaser.CANVAS, 'game');

game.state.add('Trivial.Preloader', Trivial.Preloader);
game.state.add('Trivial.Game', Trivial.Game);

game.state.start('Trivial.Preloader');

//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {
    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'createText'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.
    active: function() {console.warn("google fonts loaded!");},

    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['Press Start 2P']
    }
};