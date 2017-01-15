var Trivial = {};

Trivial.Preloader = function () {};

Trivial.Preloader.prototype = {
    init: function () {
        this.input.maxPointers = 1;
        this.scale.pageAlignHorizontally = true;
    },

    preload: function () {
        this.load.path = 'assets/';
        this.load.image("hero", "astro.png");
        this.load.images(["btn_white", "btn_blue"]);
        this.load.spritesheet('casillas', 'casillas.png', 45, 45);
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
    this.heroMoving = false;
    
    this.dice = null;
    this.boardTiles = null;
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

        // board
        this.boardTiles = this.add.group();
        this.logicBoard = [];
        for (var q=0;q<8;q++) {
            var type = (q == 7)?1:(q>0)?4:0;
            var tile = this.add.sprite(q*45, 100, "casillas", type*4, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
        }
        for (q=0;q<6;q++) {
            tile = this.add.sprite(7*45, 134+(q*34), "casillas", 16, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
        }
        for (q=8;q--;) {
            type = (q == 7)?2:(q>0)?4:3;
            tile = this.add.sprite(q*45, 134+(6*34), "casillas", type*4, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
        }
        for (q=6;q--;) {
            tile = this.add.sprite(0, 134+(q*34), "casillas", 16, this.boardTiles);
            tile.initialFrame = tile.frame;
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            tile.body.height = 33;
            this.logicBoard.push(tile);
        } 

        // hero
        this.heroPos = this.rnd.between(0, this.logicBoard.length-1);
        console.log(this.heroPos, Math.floor(this.heroPos/7));
        var pos = this.getPosForTile(this.heroPos);
        this.heroTarget = this.heroPos;
        this.hero = this.add.sprite(pos.x, pos.y, "hero");
        this.hero.anchor.setTo(0.5, 1);
        this.game.physics.arcade.enable(this.hero);
        this.hero.enableBody = true;
        this.hero.body.width = 30;
        this.hero.body.height = 10;
        this.hero.body.offset.setTo(10, 80);
        this.heroMoving = false;
        
        // buttons
        this.btnBlue = this.add.button(80, 370, "btn_blue", this.onBtnPress, this);
        this.btnWhite = this.add.button(180, 370, "btn_white", this.onBtnPress, this);
        
        // launch sample dice
        this.dice = this.rnd.between(1, 6);
        console.log("launched dice: ", this.dice);
        //mark the two available targets
        this.calculateTargetsFor(this.heroPos);

        //  Press D to toggle the debug display
        this.debugKey = this.input.keyboard.addKey(Phaser.Keyboard.D);
        this.debugKey.onUp.add(this.toggleDebug, this);
    },
    
    update: function () {
        this.boardTiles.sort('y', Phaser.Group.SORT_ASCENDING);
        
        this.boardTiles.forEach(function(t) {
            if (!t.blinking) t.frame = t.initialFrame;
        }, this);
        this.game.physics.arcade.overlap(this.hero, this.boardTiles, this.heroOverlapsTile, null, this);
        
        if (this.heroMoving) {            
            /*var tgtX = this.getPosForTile(this.heroTarget).x - 20;
            var tgtY = this.getPosForTile(this.heroTarget).y + 5;
            var nearX = this.math.fuzzyEqual(tgtX, this.hero.x, 6);
            var nearY = this.math.fuzzyEqual(tgtY, this.hero.y, 6);
            if (nearX && nearY) {
                this.heroMoving = false;
                this.hero.body.velocity.x = 0;
                this.hero.body.velocity.y = 0;
                this.hero.x = tgtX;
                this.hero.y = tgtY;
                this.heroPos = this.heroTarget;
                this.blinkTimer.resume();
                this.dice = this.rnd.between(1, 6);
                this.calculateTargetsFor(this.heroPos);
            } else {
                if (this.math.fuzzyGreaterThan(this.hero.x, tgtX, 6)) {
                    this.hero.body.velocity.x = -this.HERO_VEL;
                } else if (this.math.fuzzyGreaterThan(tgtX, this.hero.x, 6)) {
                    this.hero.body.velocity.x = this.HERO_VEL;
                }
                if (this.math.fuzzyGreaterThan(tgtY, this.hero.y, 6)) {
                    this.hero.body.velocity.y = this.HERO_VEL;
                } else if (this.math.fuzzyGreaterThan(this.hero.y, tgtY, 6)) {
                    this.hero.body.velocity.y = -this.HERO_VEL;
                }                    
            } */           
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
    
    calculateTargetsFor: function(tgt) {
        this.tgt2 = tgt - this.dice;
        if (this.tgt2 < 0) this.tgt2 = this.logicBoard.length + this.tgt2;
        this.tgt1 = tgt + this.dice;
        if (this.tgt1 >= this.logicBoard.length) this.tgt1 = this.tgt1 - this.logicBoard.length;
        
        this.clearBlinks();
        this.logicBoard[this.tgt1].blinking = "left";
        this.logicBoard[this.tgt2].blinking = "right";
    },
    
    clearBlinks: function() {
        this.boardTiles.forEach(function(t) {
            t.frame = t.frame - t.frame%4;
            delete t.blinking;
        }, this);
    },
    
    doBlinkTiles: function() {
        this.blinkValue = this.blinkValue ? false : true;
        this.boardTiles.forEach(this.blink, this);
    },
    
    endHeroMovement: function() {
        this.heroMoving = false;
        this.updateHeroPos(this.heroTarget);
        this.calculateTargetsFor(this.heroPos);
        this.blinkTimer.resume();
        var tileValue = this.BOARD[this.heroPos];
        if (tileValue > 0) {
            this.logicBoard[this.heroPos].initialFrame = (4+tileValue)*4;
        }
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

    onBtnPress: function(btn) {
        console.log(this.heroMoving);
        if (this.heroMoving) return;
        if (btn.key == "btn_white") {
            //this.updateHeroPos(this.tgt2);
            this.heroTarget = this.tgt2;
            this.dice = this.rnd.between(1,6);
            this.calculateTargetsFor(this.tgt2);
        } else if (btn.key == "btn_blue") {
            //this.updateHeroPos(this.tgt1);
            this.heroTarget = this.tgt1;
            this.dice = this.rnd.between(1,6);
            this.calculateTargetsFor(this.tgt1);
        }
        this.tweenHero();
        this.heroMoving = true;
        this.blinkTimer.pause();
        this.clearBlinks();
    },
    
    onTileOverlap: function(img) {
        console.log(arguments);
        console.log(img.overlap(this.hero));
    },
    
    tweenHero: function() {
        var currentZone = Math.floor(this.heroPos/7);
        var targetZone = Math.floor(this.heroTarget/7);
        var tween1, tween2;
        var tilesToCorner, fromCornerToTarget = 0;
        var route = [];
        if (currentZone == 0 || currentZone == 2) {
            if (currentZone == 0) {
                if (this.heroTarget > this.heroPos && this.heroTarget < 21) {
                    tilesToCorner = Math.abs(7-this.heroPos);
                    fromCornerToTarget = Math.abs(7-this.heroTarget);
                    route.push(this.getPosForTile(7));
                } else {
                    tilesToCorner = this.heroPos;
                    fromCornerToTarget = Math.abs(24-this.heroTarget);
                    route.push(this.getPosForTile(0));
                }
            } else {
                if (this.heroTarget > this.heroPos) {
                    tilesToCorner = Math.abs(21-this.heroPos);
                    fromCornerToTarget = Math.abs(this.heroTarget-21);
                    route.push(this.getPosForTile(21));
                } else {
                    tilesToCorner = Math.abs(14-this.heroPos);
                    fromCornerToTarget = Math.abs(this.heroTarget-14);
                    route.push(this.getPosForTile(14));
                }
            }   
            if (Math.abs(this.heroTarget-this.heroPos) <= tilesToCorner) {
                tilesToCorner = Math.abs(this.heroTarget-this.heroPos);
                fromCornerToTarget = 0;                
                route = [];
            }
            route.push(this.getPosForTile(this.heroTarget));
        } else {
            if (currentZone == 1) {
                if (this.heroTarget > this.heroPos) {
                    tilesToCorner = Math.abs(14-this.heroPos);
                    fromCornerToTarget = Math.abs(this.heroTarget-14);
                    route.push(this.getPosForTile(14));
                } else {
                    tilesToCorner = Math.abs(7-this.heroPos);
                    fromCornerToTarget = Math.abs(this.heroTarget-7);
                    route.push(this.getPosForTile(7));
                }
            } else {
                if (this.heroTarget > this.heroPos || this.heroTarget < 7) {
                    tilesToCorner = Math.abs(28-this.heroPos);
                    fromCornerToTarget = this.heroTarget;
                    route.push(this.getPosForTile(0));
                } else {
                    tilesToCorner = Math.abs(21-this.heroPos);
                    fromCornerToTarget = Math.abs(this.heroTarget-21);
                    route.push(this.getPosForTile(21));
                }
            }   
            if (Math.abs(this.heroTarget-this.heroPos) <= tilesToCorner) {
                tilesToCorner = Math.abs(this.heroTarget-this.heroPos);
                fromCornerToTarget = 0;
                route = [];
            }
            route.push(this.getPosForTile(this.heroTarget));
        }
        console.log("to corner:", tilesToCorner, "to target:", fromCornerToTarget);
        console.log(route);
        var dest1 = route.shift();
        tween1 = this.add.tween(this.hero).to(
            {
                x: dest1.x,
                y: dest1.y,
            }, 
            this.HERO_VEL*(tilesToCorner),
            null,
            true
        );
        tween1.onComplete.addOnce(function() {
            console.log("complete tween ONE!", arguments);
            if (route.length) {
                var dest2 = route.shift();
                tween2 = this.add.tween(this.hero).to(
                    {
                        x: dest2.x,
                        y: dest2.y
                    }, 
                    this.HERO_VEL*(fromCornerToTarget),
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

var game = new Phaser.Game(360, 640, Phaser.AUTO, 'game');

game.state.add('Trivial.Preloader', Trivial.Preloader);
game.state.add('Trivial.Game', Trivial.Game);

game.state.start('Trivial.Preloader');

