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
    this.route1 = [];
    this.route2 = [];
    
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
        
        // to-do: eliminar este bucle tan exigente
        this.boardTiles.forEach(function(t) {
            if (!t.blinking) t.frame = t.initialFrame;
        }, this);
        // to-do: eliminar este bucle tan exigente        
        this.game.physics.arcade.overlap(this.hero, this.boardTiles, this.heroOverlapsTile, null, this);
        
        if (this.heroMoving) {            
          
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
    
    calculateTargetsFor: function(currPos) {
        this.tgt2 = currPos - this.dice;
        this.route2 = [];
        if (this.tgt2 < 0) {
            this.tgt2 = this.logicBoard.length + this.tgt2;
            if (currPos > 0) this.route2.push(0);
        } else {
            if (this.tgt2 < 7 && currPos > 7) this.route2.push(7);
            if (this.tgt2 < 14 && currPos > 14) this.route2.push(14);
            if (this.tgt2 < 21 && currPos > 21) this.route2.push(21);
        }
        this.route2.push(this.tgt2);
        
        this.tgt1 = currPos + this.dice;
        this.route1 = [];
        if (this.tgt1 >= this.logicBoard.length) {
            this.tgt1 = this.tgt1 - this.logicBoard.length;
            if (currPos > 21) this.route1.push(0);
        } else {
            if (this.tgt1 > 7 && currPos < 7) this.route1.push(7);
            if (this.tgt1 > 14 && currPos < 14) this.route1.push(14);
            if (this.tgt1 > 21 && currPos < 21) this.route1.push(21);
        }
        this.route1.push(this.tgt1);
        
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
            this.tweenHero(false, this.dice);
            this.dice = this.rnd.between(1,6);
            this.calculateTargetsFor(this.tgt2);
        } else if (btn.key == "btn_blue") {
            //this.updateHeroPos(this.tgt1);
            this.heroTarget = this.tgt1;
            this.tweenHero(true, this.dice);
            this.dice = this.rnd.between(1,6);
            this.calculateTargetsFor(this.tgt1);
        }
        this.heroMoving = true;
        this.blinkTimer.pause();
        this.clearBlinks();
    },
    
    onTileOverlap: function(img) {
        console.log(arguments);
        console.log(img.overlap(this.hero));
    },
    
    tweenHero: function(clockwise, distance) {
        var route = clockwise ? this.route1 : this.route2;
        console.log(route);
        var dest1 = this.getPosForTile(route.shift());
        tween1 = this.add.tween(this.hero).to(
            {
                x: dest1.x,
                y: dest1.y,
            }, 
            this.HERO_VEL * distance,
            null,
            true
        );
        tween1.onComplete.addOnce(function() {
            console.log("complete tween ONE!", arguments);
            if (route.length) {
                var dest2 = this.getPosForTile(route.shift());
                tween2 = this.add.tween(this.hero).to(
                    {
                        x: dest2.x,
                        y: dest2.y
                    }, 
                    this.HERO_VEL * distance,
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

