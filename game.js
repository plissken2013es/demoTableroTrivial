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
    this.HERO_VEL   = 90;
    
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

        // board
        this.boardTiles = this.add.group();
        this.logicBoard = [];
        for (var q=0;q<8;q++) {
            var type = (q == 7)?1:(q>0)?4:0;
            var tile = this.add.image(q*45, 100, "casillas", type*4, this.boardTiles);
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            this.logicBoard.push(tile);
        }
        for (q=0;q<6;q++) {
            tile = this.add.image(7*45, 134+(q*34), "casillas", 16, this.boardTiles);
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            this.logicBoard.push(tile);
        }
        for (q=8;q--;) {
            type = (q == 7)?2:(q>0)?4:3;
            tile = this.add.image(q*45, 134+(6*34), "casillas", type*4, this.boardTiles);
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
            this.logicBoard.push(tile);
        }
        for (q=6;q--;) {
            tile = this.add.image(0, 134+(q*34), "casillas", 16, this.boardTiles);
            tile.anchor.setTo(0, 0.5);
            this.game.physics.arcade.enable(tile);
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
        
        
        if (this.heroMoving) {            
            this.heroMoving = false;
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
        }
    },
    
    // custom methods
    blink: function(tile) {
        if (tile.blinking) {
            if (this.blinkValue) {
                if (tile.blinking == "left" && tile.frame%4 == 0) {
                    tile.frame = tile.frame + 1;
                } else {
                    tile.frame = tile.frame - tile.frame%4;
                }
            } else {
                if (tile.blinking == "right" && tile.frame%4 == 0) {
                    tile.frame = tile.frame + 2;
                } else {
                    tile.frame = tile.frame - tile.frame%4;
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
    
    getPosForTile: function(boardTile) {
        return new Phaser.Point (
            22 + this.logicBoard[boardTile].x,
            -5 + this.logicBoard[boardTile].y
        );
    },    
    
    incrementIdxTest: function() {
        this.idxTest ++;
        this.idxTest = (this.idxTest < this.logicBoard.length) ? this.idxTest : 0;
    },

    onBtnPress: function(btn) {
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
        //this.heroMoving = true;
        //this.blinkTimer.pause();
        //this.clearBlinks();
    },
    
    onTileOverlap: function(img) {
        console.log(arguments);
        console.log(img.overlap(this.hero));
    },
    
    tweenHero: function() {
        var currentZone = Math.floor(this.heroPos/7);
        var targetZone = Math.floor(this.heroTarget/7);
        var tweenX, tweenY;
        var tilesToCorner;
        if (currentZone == 0 || currentZone == 2) {
            if (currentZone == 0) {
                if (this.heroTarget > this.heroPos && this.heroTarget < 21) {
                    tilesToCorner = Math.abs(7-this.heroPos);
                } else {
                    tilesToCorner = this.heroPos;
                }
            } else {
                if (this.heroTarget > this.heroPos) {
                    tilesToCorner = Math.abs(21-this.heroPos);
                } else {
                    tilesToCorner = Math.abs(14-this.heroPos);
                }
            }   
            if (Math.abs(this.heroTarget-this.heroPos) < tilesToCorner) {
                tilesToCorner = Math.abs(this.heroTarget-this.heroPos);
            }
            tweenX = this.add.tween(this.hero).to(
                {x: this.getPosForTile(this.heroTarget).x}, 
                500*(tilesToCorner),
                null,
                true
            );
            tweenX.onComplete.addOnce(function() {
                console.log("complete X!", arguments);
                this.updateHeroPos(this.heroTarget);
            }, this);
        } else {
            if (currentZone == 1) {
                if (this.heroTarget > this.heroPos) {
                    tilesToCorner = Math.abs(14-this.heroPos);
                } else {
                    tilesToCorner = Math.abs(7-this.heroPos);
                }
            } else {
                if (this.heroTarget > this.heroPos || this.heroTarget < 8) {
                    tilesToCorner = Math.abs(28-this.heroPos);
                } else {
                    tilesToCorner = Math.abs(21-this.heroPos);
                }
            }   
            if (Math.abs(this.heroTarget-this.heroPos) < tilesToCorner) {
                tilesToCorner = Math.abs(this.heroTarget-this.heroPos);
            }
            tweenY = this.add.tween(this.hero).to(
                {y: this.getPosForTile(this.heroTarget).y}, 
                500*(tilesToCorner),
                null,
                true
            );
            tweenY.onComplete.addOnce(function() {
                console.log("complete Y!", arguments);
                this.updateHeroPos(this.heroTarget);
            }, this);
        }
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

