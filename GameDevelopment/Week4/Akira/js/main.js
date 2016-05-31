  var WarpedSound = function(game, key, volume, loop) {
    Phaser.Sound.call(this, game, key, volume, loop);
    game.sound._sounds.push(this);
  }

  WarpedSound.prototype = Object.create(Phaser.Sound.prototype);

  WarpedSound.prototype.constructor = WarpedSound;

  WarpedSound.prototype.setSpeed = function(speed) {
    if(!!this._sound) {
      this._sound.playbackRate.value = speed;
    } else {
      this.onPlay.addOnce(function() {
        this._sound.playbackRate.value = speed;
      }, this);
    }
  }

  WarpedSound.prototype.tweenSpeed = function(speed, duration) {
    function applyTween(s, d) {
      game.add.tween(this._sound.playbackRate).to({value: s}, d, Phaser.Easing.Linear.NONE, true);
    }
    if(!!this._sound) {
      applyTween.call(this, speed, duration);
    } else {
      this.onPlay.addOnce(function() {
         applyTween.call(this, speed, duration)
      }, this);
    }
  }

  WarpedSound.prototype.createFilter = function(maxHZ) {
    maxHZ = maxHZ || 440;
    function applyFilter(hz) {
      this._filter = this.context.createBiquadFilter();
      // Create the audio graph.
      this._sound.connect(this._filter);
      this._filter.connect(this.context.destination);
      // Create and specify parameters for the low-pass filter.
      this._filter.type = 0; // Low-pass filter. See BiquadFilterNode docs
      this._filter.frequency.value = hz; // Set cutoff to passed in HZ
    };

    if(!!this._sound) {
      applyFilter.call(this, maxHZ);
    } else {
      this.onPlay.addOnce(function() {
         applyFilter.call(this, maxHZ)
      }, this);
    }
  };

  WarpedSound.prototype.tweenFilter = function(maxHZ, duration) {
    maxHZ = maxHZ || 100;
    duration = duration || 1000;
    function applyTween(s, d) {
      if(!this._filter) {
        this.createFilter();
      }
      game.add.tween(this._filter.frequency).to({value: s}, d, Phaser.Easing.Linear.NONE, true);
    }
    if(!!this._sound) {
      applyTween.call(this, maxHZ, duration);
    } else {
      this.onPlay.addOnce(function() {
         applyTween.call(this, maxHZ, duration)
      }, this);
    }
  }
var audio;

//This sets the variable for the spacebar.
var spaceKey;
//This sets the variable for music
var winMusic;
var gameMusic;
//This sets the initial speed for the obstacle and coins
var randInt;
var randObstacle = -250;
var randCoin = -400;
var randPlatformHeight = 400;

//This sets the score to start at -1.
var score = 0;

//This is the object which runs the game.
var mainState = {

	preload: function(){

		//These things sets the assets for the game. If you want to add music or images, there is where you would preload it.
		game.load.image('background', 'assets/background.png');
		game.load.image('player', 'assets/BananaPlayer.png');
		game.load.image('ground', 'assets/DevleaguePlatformV3.png');
		game.load.image('obstacle', 'assets/wallVertical.png');
		game.load.image('coin', 'assets/banana.gif');
		game.load.audio('win', 'assets/win.mp3');
		game.load.audio('lose', 'assets/imaLoser.mp3')
		game.load.audio('music', 'assets/chocobo-modloop01.mp3');
		game.load.audio('coin', 'assets/coin.mp3');
		game.load.audio('jump', 'assets/jump.wav')
		//If you'd like to load music files, the format would look like this. game.load.audio('[name of music]', ['[location for music file]']);

	},

	create: function(){

		//This sets the game physics to Arcade style.
		game.physics.startSystem(Phaser.Physics.ARCADE);

		//This sets the background color to #3498db on the hex system.
		game.stage.backgroundColor = '#3498db';

		//This gives us sharp corners for all of our images.
		game.renderer.renderSession.roundPixels = true;

		// This would be a good place to start the general music for the game.
		audio = new WarpedSound(game, 'music', 0.3);
		gameWin = game.add.audio('win');
		gameLose = game.add.audio('lose');
		coinSound = game.add.audio('coin');
		jumpSound = game.add.audio('jump');
    	audio.tweenSpeed(1);
    	audio.loop=true
		audio.play();

		//This sets up a group call platforms. For future functionality we can set all horizontal surfaces to this group.
		platforms = game.add.group();
		platforms.enableBody = true;

		//This creates the ground, and makes it solid object the player will not pass through.
		this.ground = platforms.create(0, 550, 'ground');
		this.ground.anchor.setTo(0,0);
		this.ground.scale.setTo(1, 1);
		game.physics.arcade.enable(this.ground);
		this.ground.body.immovable = true;

		// for (i = 0; i < 10; i++){
			this.mplatform = game.add.sprite(700, 400, 'ground');
			this.mplatform.anchor.setTo(0,1);
			this.mplatform.scale.setTo(0.5,0.5);
			game.physics.arcade.enable(this.mplatform);
			this.mplatform.enableBody = true;
			this.mplatform.body.immovable = true;
		// }




		//This creates the player character at the bottom left side of the screen.
		this.player = game.add.sprite(game.width/8, 550, 'player');
		this.player.scale.setTo(0.25,0.25);
		this.player.anchor.setTo(0,1);
		game.physics.arcade.enable(this.player);

		//This sets the spacebar key as the input for this game.
		this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

		//This sets the physics on the player in terms of the gravity and the bounce.
		this.player.body.bounce.y = 0.2;
		this.player.body.gravity.y = 600;

		//This creates a new sprite for a coin to be collected
		coins = game.add.group();
		this.coin = coins.create(800,300,'coin');
		this.coin.anchor.setTo(0,1);
		game.physics.arcade.enable(this.coin);

		//This creates the first obstacle on the right side of the screen.
		this.obstacle = game.add.sprite(700,550, 'obstacle');
		this.obstacle.scale.setTo(1,0.2);
		this.obstacle.anchor.setTo(0,1);
		game.physics.arcade.enable(this.obstacle);
		this.obstacle.body.immovable = true;

		//This adds the scoreboard on the top left side of the screen.
		scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
	},

	update: function(){

		//This is where the game engine recognizes collision between the player and the ground.
		game.physics.arcade.collide(this.player, this.ground);
		game.physics.arcade.collide(this.player, this.mplatform);
		//This is where the game engine recognizes collision between the player and the obstacle, and will run the gameOver function if they hit.
		game.physics.arcade.collide(this.player, this.obstacle, gameOver);
		//This creates a condition to run the collectCoin function when the coin and the player overlap.
		game.physics.arcade.overlap(this.player, this.coin, collectCoin, null, this);

		//This will set the horizontal movement to zero.
		this.player.body.velocity.x = 0;

		//This will create a new wall if the old wall goes off the screen.
		if (this.obstacle.x < 0) {
			this.obstacle.kill();
			score += 2;
			scoreText.text = 'score: ' + score;
			scoreText.text = 'score: ' + score;
			if (score >= 48) {
				winText = game.add.text(350,200, 'You Win!', {fill: '#ff0000'});
				audio.pause();
				gameWin.play();
				this.player.kill();
				this.obstacle.kill();
				this.coin.kill();
				return;
			}
			this.obstacle = game.add.sprite(900,550, 'obstacle');
			//This below sets a random speed for the next obstacle, the range is from -200 to -600
			//randInt = -(Math.floor(Math.random()*40)*10)-200;
			speedChange();
			console.log(randInt);
			this.obstacle.scale.setTo(1,0.2);
			this.obstacle.anchor.setTo(0,1);
			game.physics.arcade.enable(this.obstacle);
			this.obstacle.body.immovable = true;
		};

		//This will create a new coin if the old coin goes off the screen.
		if (this.coin.x < 0){
			this.coin.kill();
			randCoinHeight = (Math.floor(Math.random()*22)*10)+250
			this.coin = coins.create(800, randCoinHeight, 'coin');
			//The below also sets a new speed for the coin between -200 and -600.
			randCoin = -(Math.floor(Math.random()*40)*10)-200;
			game.physics.arcade.enable(this.coin);
		};

		if (this.mplatform.x < -600){
			this.mplatform.kill();
			randPlatformHeight = (Math.floor(Math.random()*22)*10)+250
			this.mplatform = game.add.sprite(700, randPlatformHeight, 'ground');
			this.mplatform.anchor.setTo(0,1);
			this.mplatform.scale.setTo(0.5,0.5);
			game.physics.arcade.enable(this.mplatform);
			this.mplatform.enableBody = true;
			this.mplatform.body.immovable = true;
		}

		//This will move the obstacle to the left if it is on the right side of the screen.
		if (this.obstacle.x > 600) {
			this.obstacle.body.velocity.x = randObstacle;
		};

		if (this.mplatform.x > -900) {
			this.mplatform.body.x -= 5;
		};

		//This moves the coin to the left.
		if (this.coin.x > 600) {
			this.coin.body.velocity.x = randCoin;
		};

		//This removes the coin and adds 10 points to the score.
		function collectCoin(player,coin){
			//This is a good place to add sound for collecting the coin.
			coinSound.play();
			coin.kill();
			score+=10;
			scoreText.text = 'score: ' + score;
			if (score >= 48) {
				winText = game.add.text(350,200, 'You Win!', {fill: '#ff0000'});
				audio.pause();
				gameWin.play();
				this.player.kill();
				this.obstacle.kill();
				this.coin.kill();
				return;
			}
			//This creates a new coin now that one has been collected.
			randCoinHeight = (Math.floor(Math.random()*22)*10)+250
			this.coin = coins.create(800, randCoinHeight, 'coin');
			randCoin = -(Math.floor(Math.random()*40)*10)-200;
			game.physics.arcade.enable(this.coin);
		};



		//This allows the player to jump only if you press the space key and the player is touching the something at the bottom.
		if (this.spaceKey.isDown && this.player.body.touching.down){
			this.player.body.velocity.y = -600;
			//This is a good place to add the sound for when the player jumps.
			jumpSound.play();
		};

		//This will tell you "You Lose!" if the player is pushed off the left side of the screen.
		function gameOver(player,obstacle){
			gameOverText = game.add.text(350,200, 'You Lose!', {fill: '#ff0000'});
			audio.pause();
			gameLose.play();
			player.kill();
			obstacle.kill();
		};


		//This changes the speed of the music between five different outcomes. That way with every new obstacle, the music will match the speed.
		function speedChange(){
			randInt = Math.floor(Math.random()*5);
				switch (randInt) {
					case 0:
						randObstacle = -150;
						audio.tweenSpeed(0.5);
						break;
					case 1:
						randObstacle = -200;
						audio.tweenSpeed(0.75);
						break;
					case 2:
						randObstacle = -250;
						audio.tweenSpeed(1);
						break;
					case 3:
						randObstacle = -300;
						audio.tweenSpeed(1.25);
						break;
					case 4:
						randObstacle = -350;
						audio.tweenSpeed(1.5);
						break;
				}
		}

	}
};

//This sets the size of the game screen and sets it to the div "gameDiv".
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameDiv');

//This starts the game, by running the object "mainState".
game.state.add('main', mainState);
game.state.start('main');