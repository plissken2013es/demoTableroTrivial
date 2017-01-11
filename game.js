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
    
    this.hero = null;
    this.heroPos = 3;
    
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
        var pos = this.getPosForHero(this.heroPos);
        this.hero = this.add.image(pos.x, pos.y, "hero");
        this.hero.anchor.setTo(0.5, 1);
        this.game.physics.arcade.enable(this.hero);
        
        // buttons
        this.btnBlue = this.add.button(80, 370, "btn_blue", this.onBtnPress, this);
        this.btnWhite = this.add.button(180, 370, "btn_white", this.onBtnPress, this);
        
        // launch sample dice
        this.dice = this.rnd.between(1, 6);
        console.log("launched dice: ", this.dice);
        //mark the two available targets
        this.calculateTargets();

        //  Press D to toggle the debug display
        this.debugKey = this.input.keyboard.addKey(Phaser.Keyboard.D);
        this.debugKey.onUp.add(this.toggleDebug, this);
    },
    
    update: function () {
        this.boardTiles.sort('y', Phaser.Group.SORT_ASCENDING);
    },

    render: function () {
        if (this.showDebug) {
            this.game.debug.text("Debug ON", 32, 32);
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
    
    calculateTargets: function() {
        this.tgt1 = this.heroPos - this.dice;
        if (this.tgt1 < 0) this.tgt1 = this.logicBoard.length + this.tgt1;
        this.tgt2 = this.heroPos + this.dice;
        if (this.tgt2 >= this.logicBoard.length) this.tgt2 = this.tgt2 - this.logicBoard.length;
        
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
    
    getPosForHero: function(boardTile) {
        return new Phaser.Point (
            22 + this.logicBoard[this.heroPos].x,
            -5 + this.logicBoard[this.heroPos].y
        );
    },
    
    incrementIdxTest: function() {
        this.idxTest ++;
        this.idxTest = (this.idxTest < this.logicBoard.length) ? this.idxTest : 0;
    },

    onBtnPress: function(btn) {
        console.log(btn);
        if (btn.key == "btn_white") {
            this.updateHeroPos(this.tgt2);
            this.dice = this.rnd.between(1,6);
            this.calculateTargets();
        } else if (btn.key == "btn_blue") {
            this.updateHeroPos(this.tgt1);
            this.dice = this.rnd.between(1,6);
            this.calculateTargets();
        }
    },
    
    onTileOverlap: function(img) {
        console.log(arguments);
        console.log(img.overlap(this.hero));
    },
    
    toggleDebug: function () {
        this.showDebug = this.showDebug ? false : true;
        console.log("toggleDebug:", this.showDebug);
    },
    
    updateHeroPos: function(newPos) {
        this.heroPos = newPos;
        var coords = this.getPosForHero(this.heroPos);
        this.hero.x = coords.x;
        this.hero.y = coords.y;
    }
};

var game = new Phaser.Game(360, 640, Phaser.AUTO, 'game');

game.state.add('Trivial.Preloader', Trivial.Preloader);
game.state.add('Trivial.Game', Trivial.Game);

game.state.start('Trivial.Preloader');

