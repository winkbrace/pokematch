/**
 * GameEngineClass
 * The controller class.  Looks for actions to execute and delegates them to other classes.
 * game is responsible for knowing what tile is where on the board
 * @author Bas
 */
GameEngineClass = Class.extend({

	// current block
	block: {"tiles": [], "color": ''},

	// next block
	next_block: {},

	// current location
	block_location: {'x':0, 'y':0},

	// starting location
	start: {'x':0, 'y':0},

	// array to keep track of which grid pokemons are filled
	grid: [],

	// object with all colors to calculate the score with
	score: {},

	// total score
	total_score: 0,

	// timer, amount of microseconds you have to place a block and boolean indicator if game is currently paused or not
	timer: null,
	time_to_place_block: 9000,
	time_left: 9000,
	paused: false,

	// collect the pokemons with bombs and blobs found when removing pokemons in here
	// By first collecting all specials, we can make bombs explode simultaneously.
	specials_to_execute: {'bombs':[], 'blobs':[]},

	// input handling update loop
	move_loop: null,

	game_is_over: true,

	loading: true,

	has_high_score: false,

	// set up for a new game
	new_game: function()
	{
		// reset grid array
		game.reset_grid();

		// set starting location
		game.start.x = (board.width / board.tilesize) - 3;
		game.start.y = -3;

		// clear start and next block area
		game.block = {"tiles": [], "color": ''};
		game.next_block = {};

		// clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		$("#popup").clearCanvas();
		$("#loader_gif").hide();

		// setup new board
		board.init();

		// roll a next block 2 times, so that the first will be placed at the start area
		game.roll_next_block();
		game.roll_next_block();

		// start the update loop for handling the user input
		game.reset_move_loop();

		// draw inital score of 0
		game.total_score = 0;
		board.draw_total_score(0);

		game.game_is_over = false;
		game.has_high_score = false;
	},

	// the start game action when user presses ENTER after loading has finished
	start_game: function() {
		// draw background canvas
		$('#background').clearCanvas().drawImage({
			source: "img/background.png",
			fromCenter: false
		});

		game.loading = false;

		// then start the game
		game.new_game();
		// pause the game so the player will see the controls
		game.pause_game();
	},

	// pause the game
	pause_game: function()
	{
		if (game.paused)
			return null;

		game.pause_timer();
		game.paused = true;

		// draw paused screen
		$("#popup").drawImage({source:"img/popup.png", fromCenter:false});
	},

	// resume the game (after pause)
	resume_game: function()
	{
		if (! game.paused)
			return null;

		// if game has ended, don't resume, just close the popup
		if (! game.game_is_over)
			game.resume_timer();

		game.paused = false;

		$("#popup").clearCanvas();
	},

	// reset update loop
	reset_move_loop: function()
	{
		if (game.move_loop)
			clearInterval(game.move_loop);

		game.move_loop = setInterval(function() {
			// only moves are executed with this update loop
			for (key in gInputEngine.actions) {
				if (gInputEngine.actions[key]) {
					game.execute_input(key);
				}
			}
		}, 65);
	},

	// reset grid array
	reset_grid: function()
	{
		var tx = board.width / board.tilesize;  // # pokemons in x direction
		var ty = board.height / board.tilesize; // # pokemons in y direction
		for (var x=0; x<tx; x++) {
			game.grid[x] = [];
			for (var y=0; y<ty; y++) {
				game.grid[x][y] = {'x':x, 'y':y};
			}
		}
		// add starting area pokemons to grid
		for (var x=tx-3; x<tx; x++) {
			for (var y=-3; y<0; y++) {
				game.grid[x][y] = {'x':x, 'y':y};
			}
		}
	},

	// reset score
	reset_score: function()
	{
		game.score = {
	    	"blue": 	0,
	    	"green": 	0,
	        "red": 		0,
	        "maya": 	0,
	        "orange": 	0,
	        "purple": 	0,
	        "yellow": 	0
	    };
	},

	// reset timer
	// by passing time_left parameter, make the timer start at that time.
	reset_timer: function(time_left)
	{
		if (game.timer)
			clearInterval(game.timer); // stop previous interval

		game.time_left = time_left ? time_left : game.time_to_place_block;
		game.timer = setInterval(function()
		{
			// draw timer bar
			board.draw_timer(game.time_left / game.time_to_place_block);

			game.time_left -= 50;
			if (game.time_left == 0) {
				clearInterval(game.timer); // stop interval
				game.put_down();
			}
		}, 50);
	},

	pause_timer: function()
	{
		if (game.timer)
			clearInterval(game.timer); // stop interval
	},

	resume_timer: function()
	{
		game.reset_timer(game.time_left);
	},

	// move a block on the board
	move: function(x, y)
	{
		// remove block from grid. The test if can_be_placed_at new location will then
		// not look at the space our block is currently occupying
		game.remove_from_grid();

		// test if block can be placed at new location
		if (game.can_be_placed_at(x, y))
		{
			game.clear_tiles(game.block.pokemons);

			// move block
			game.place(x, y);
			sfx.play('move');
		}
		else
		{
			// put block back on grid
			game.place_on_grid();
			sfx.play('error');
		}
	},

	/**
	 * place the block on the given location
	 * @param x
	 * @param y
	 */
	place: function(x, y)
	{
		// set new location
		game.block_location.x = x;
		game.block_location.y = y;

		// place block on grid at new location
		game.place_on_grid();

		// draw block at new location
		board.draw_block(game.block, game.block_location.x, game.block_location.y);
	},

	/**
	 * check if all pokemons of this block can be placed at the given location
	 * @param x
	 * @param y
	 * @returns {Boolean}
	 */
	can_be_placed_at: function(x, y)
	{
		// check if all pokemons of this block can be placed at the given location
		for (var i=0; i<game.block.pokemons.length; i++)
		{
			var tile_x = game.block.pokemons[i].x + x;
			var tile_y = game.block.pokemons[i].y + y;
			if (game.grid[tile_x] === undefined)  // out of bounds
				return false;
			if (game.grid[tile_x][tile_y] === undefined)  // out of bounds
				return false;
			if (game.grid[tile_x][tile_y].color !== undefined)  // occupied
				return false;
		}

		return true;
	},

	/**
	 * remove block from grid only
	 */
	remove_from_grid: function()
	{
		// loop through all pokemons in the block and remove them from the grid
		for (var i=0; i<game.block.pokemons.length; i++)
		{
			var tile_x = game.block.pokemons[i].x + game.block_location.x;
			var tile_y = game.block.pokemons[i].y + game.block_location.y;
			game.grid[tile_x][tile_y] = {'x':tile_x, 'y':tile_y};
		}
	},

	/**
	 * remove given pokemons from the current block
	 */
	remove_tiles_from_block: function(tiles)
	{
		// delete all pokemons passed in pokemons
		for (var i=0; i<tiles.length; i++) {
			tile = tiles[i];
			// check all pokemons in the block and remove the one with the same coordinates
			for (var j=0; j<game.block.pokemons.length; j++) {
				if (game.block.pokemons[j].x == tile.x && game.block.pokemons[j].y == tile.y) {
					game.block.pokemons.splice(j, 1);
					break; // go to next tile
				}
			}
		}
		// by removing pokemons, the topleft position might have shifted, so we need to move the block so,
		// that it will remain in the same place as we shift the pokemons to the topleft.
		game.tidy_block_tiles();

		// if no pokemons left, then go to next block
		if (game.block.pokemons.length == 0)
			game.roll_next_block();
	},

	/**
	 * Move all pokemons to the top left
	 * Move the block in the opposite direction to ensure it will remain in the same place on the board
	 */
	tidy_block_tiles: function()
	{
		var topleft = {'x':9, 'y':9};
		for (var i=0; i<game.block.pokemons.length; i++) {
			var tile = game.block.pokemons[i];
			topleft.x = tile.x < topleft.x ? tile.x : topleft.x;
			topleft.y = tile.y < topleft.y ? tile.y : topleft.y;
		}

		if (topleft.x > 0)
		{
			for (var i=0; i<game.block.pokemons.length; i++)
				game.block.pokemons[i].x -= topleft.x;

			game.block_location.x += topleft.x;
		}
		if (topleft.y > 0)
		{
			for (var i=0; i<game.block.pokemons.length; i++)
				game.block.pokemons[i].y -= topleft.y;

			game.block_location.y += topleft.y;
		}
	},

	/**
	 * place block on grid only
	 */
	place_on_grid: function()
	{
		var blobs = []; // collect in array, to not alter the game.block.pokemons array while we are looping through it.

		// loop through all pokemons in the block and place them on the grid
		for (var i=0; i<game.block.pokemons.length; i++)
		{
			var tile = game.block.pokemons[i];
			var tx = tile.x + game.block_location.x;
			var ty = tile.y + game.block_location.y;

			// if the grid tile contains a blob, the block tile will remain there and be removed from the block
			// TODO someday: This is not the most logical spot considering the function name
			if (game.grid[tx][ty].blob) {
				blobs.push(tile);
				// draw removed tile on board (placing on grid is done right below)
				board.draw_pokemon(game.block.color, tile.special, tx, ty);
			}

			game.grid[tx][ty] = {"color": game.block.color, "special": tile.special, "x":tx, "y":ty};
		}

		// remove blob pokemons from block
		if (blobs.length)
			game.remove_tiles_from_block(blobs);
	},

	/**
	 * turn block left or right
	 */
	turn: function(direction)
	{
		// save current tile positions
		var current_tiles = game.block.pokemons;

		// remove block from grid for testing if the turned block can be placed
		game.remove_from_grid();

		// get the new tile positions for this block
		var tiles = g_blocks_creator.rotate_block(current_tiles);

		// rotate left = rotate right 3 times
		if (direction == 'left')
		{
			tiles = g_blocks_creator.rotate_block(tiles);
			tiles = g_blocks_creator.rotate_block(tiles);
		}

		// test if new pokemons will fit
		game.block.pokemons = tiles;
		if (game.can_be_placed_at(game.block_location.x, game.block_location.y))
		{
			// remove current pokemons from board
			this.clear_tiles(current_tiles);

			// place new pokemons
			game.place(game.block_location.x, game.block_location.y);
			sfx.play('move');
		}
		else
		{
			// put current_tiles back on grid
			game.block.pokemons = current_tiles;
			game.place_on_grid();
			sfx.play('error');
		}
	},

	/**
	 * remove pokemons of block from board
	 */
	clear_tiles: function(tiles)
	{
		// loop through all pokemons in the block and clear them from the board
		for (var i=0; i<tiles.length; i++)
		{
			var tile_x = tiles[i].x + game.block_location.x;
			var tile_y = tiles[i].y + game.block_location.y;
			board.clear_tile(tile_x, tile_y);
		}
	},

	/**
	 * execute the player input
	 * moves are executed in the move_loop. The other actions are executed on keydown
	 */
	execute_input: function(action)
	{
		if (game.paused && action != 'pause' && action != 'toggle-sound')
			return null;

		// get current location locally for easier typing ;P
		var x = game.block_location.x;
		var y = game.block_location.y;

		switch (action)
		{
			/**
			 * move
			 * Don't collect actions in changes to x and y, but immediately (try to) execute the move,
			 * because we have to move 1 direction at a time anyway
			 */
			case 'move-up':    game.move(x, y-1); break;
			case 'move-right': game.move(x+1, y); break;
			case 'move-down':  game.move(x, y+1); break;
			case 'move-left':  game.move(x-1, y); break;

			// turn
			case 'turn-left':  game.turn('left'); break;
			case 'turn-right': game.turn('right'); break;

			// put down
			case 'put-down':
				// make sure user is not in the start position
				if (! (game.block_location.x == game.start.x && game.block_location.y == game.start.y))
					game.put_down();
				break;

			// pause
			case 'pause':
				if (game.paused)
					game.resume_game();
				else
					game.pause_game();
				break;

			// toggle sound
			case 'toggle-sound':
				sfx.silent = sfx.silent ? false : true;
				break;
		}

	},

	/**
	 * put the block down and check if a cluster is made
	 */
	put_down: function()
	{
		sfx.play('place');

		var score = 10; // 10 points for placing a block

		// Go over every x field in the row and if it is true,
		// we check if all fields have a tile if we hypothesize this field is the top left of a cluster.
		// We only look for 3x3's, so we don't have to consider all other possibilities to score more than a cluster.
		// we would only have to search the immediate surroundings of the placed block, because the rest can't have gotten a cluster, unless a cluster of bricks is made. =/
		var found = [];
		for (var x=0; x<game.grid.length; x++) {
			for (var y=-3; y<(board.height/board.tilesize)-1; y++) {
				if (game.grid[x] && game.grid[x][y] && game.grid[x][y].color) {
					// check if this is the top left of a cluster
					if (game.is_a_cluster(x,y)) {
						found.push({'x':x, 'y':y});
					}
				}
			}
		}

		if (found.length > 0) {
			// play sound
			sfx.play('score');

			// calculate score before removing any pokemons ;)
			for (var i=0; i<found.length; i++) {
				var topleft = found[i];
				game.calculate_score(topleft.x, topleft.y);
			}

			// calculate total score
			// every tile of the same color is worth 1 more than the previous tile
			for (var key in game.score) {
				for (var n=0; n<=game.score[key]; n++) {
					score += n;
				}
			}

			// remove all squares found and collect special tile tasks
			for (var i=0; i<found.length; i++) {
				var topleft = found[i];
				var tiles = [];
				for (var x=topleft.x; x<=topleft.x+2; x++) {
					for (var y=topleft.y; y<=topleft.y+2; y++) {
						tiles.push(game.grid[x][y]);
					}
				}
				game.remove_tiles(tiles);
			}

			// execute special tile tasks
			game.execute_collected_special_tasks();

			// draw floating score in center of placed tile
			board.draw_score(score, game.block_location.x + 1, game.block_location.y + 1);
		}

		// add score to total_score
		game.total_score += score;
		board.draw_total_score(game.total_score);

		game.roll_next_block();
	},

	/**
	 * calculate the score of the cluster square by passing the top left
	 * @param px
	 * @param py
	 */
	calculate_score: function(px, py)
	{
		// calculate score
		for (var x=px; x<=px+2; x++) {
			for (var y=py; y<=py+2; y++) {
				// score per color, each additional field of the same color is worth an extra point
				game.score[game.grid[x][y].color] += 1;  // use score as a counter per color
			}
		}
	},

	/**
	 * remove a tile from the board and the grid. Perform the special if there is one
	 * @param tile
	 */
	remove_tile: function(tile, with_bomb)
	{
		// handle brick or shield. When triggered with a bomb, do nothing special, just remove the tile
		if (tile.special && ! with_bomb)
		{
			if (tile.special == 'brick') {
				return null; // don't remove the brick with normal remove
			} else if (tile.special == 'shield') {
				// remove the shield, but let the tile stay
				tile.special = null;
				board.draw_pokemon(tile.color, tile.special, tile.x, tile.y); // draw tile without shield
				return null;
			}
		}

		tile = copy(tile); // create a copy, because tile is the reference to grid[x][y]

		// remove from grid
		game.grid[tile.x][tile.y] = {'x':tile.x, 'y':tile.y};
		// remove from board
		board.clear_tile(tile.x, tile.y);

		return tile; // return the tile, because blobs or bombs have to be handled later in the calling function (remove_tiles)
	},

	/**
	 * remove the given pokemons from the board and grid and collect the specials to execute
	 * @param array pokemons
	 */
	remove_tiles: function(tiles, with_bomb)
	{
		// remove from grid if specials allow it and handle or collect special
		for (var i=0; i<tiles.length; i++) {
			var tile = game.remove_tile(tiles[i], with_bomb);
			// a blob or bomb tile gets returned. else return is null. (Except with a bomb, then everything gets removed and thus returned.)
			if (tile) {
				if (tile.special == 'blob')
					game.specials_to_execute.blobs.push(tile);
				else if (tile.special == 'bomb')
					game.specials_to_execute.bombs.push(tile);
			}
		}
	},

	/**
	 * execute the collected special tasks (blob and bomb)
	 */
	execute_collected_special_tasks: function()
	{
		// first handle blobs
		if (game.specials_to_execute.blobs.length)
		{
			// TODO get blob sound

			for (var i=0; i<game.specials_to_execute.blobs.length; i++) {
				var blob = game.specials_to_execute.blobs[i];
				// put blobs on the surrounding free pokemons
				for (var x=blob.x-1; x<=blob.x+1; x++) {
					for (var y=blob.y-1; y<=blob.y+1; y++) {
						// the grid coordinates must exist && there must not be a tile && it cannot be in the start area
						if (game.grid[x] && game.grid[x][y] && ! game.grid[x][y].color && y >= 0) {
							game.grid[x][y] = {"blob": true, 'x':x, 'y':y};
							board.draw_blob(x, y);
						}
					}
				}
			}
		}

		// finally handle bombs
		if (game.specials_to_execute.bombs.length)
		{
			// play bomb sound
			sfx.play('bomb');

			// draw the explosion
			board.draw_explosions(game.specials_to_execute.bombs);

			for (var i=0; i<game.specials_to_execute.bombs.length; i++) {
				var bomb = game.specials_to_execute.bombs[i];

				// remove any tile from the (pretty large) grid around the bomb
				//  ###
				// #####
				// ##B##
				// #####
				//  ###
				var btiles = [];
				for (var x=bomb.x-2; x<=bomb.x+2; x++) {
					for (var y=bomb.y-2; y<=bomb.y+2; y++) {
						if (Math.abs(x) + Math.abs(y) == 4)  // smart math trick to not make the corners explode
							continue;
						if (! game.grid[x] || ! game.grid[x][y]) // make sure the grid coordinates exist
							continue;
						if (game.grid[x][y].color || game.grid[x][y].blob) // only collect pokemons with block or blob on them
							btiles.push(game.grid[x][y]);
					}
				}
				// remove these pokemons
				if (btiles.length > 0)
					game.remove_tiles(btiles, true);
			}
		}

		// reset
		game.specials_to_execute = {'bombs':[], 'blobs':[]};

	},

	/**
	 * check if this is the top left of a cluster
	 * @param px
	 * @param py
	 * @returns {Boolean}
	 */
	is_a_cluster: function(px, py)
	{
		for (var x=px; x<=px+2; x++) {
			for (var y=py; y<=py+2; y++) {
				// first 2 are out of bounds, last one is not occupied
				if (! game.grid[x] || ! game.grid[x][y] || ! game.grid[x][y].color)
					return false;
			}
		}
		return true;
	},

	/**
	 * roll a next block. Will move current next block to start area and make it the current block.
	 */
	roll_next_block: function()
	{
		if (game.next_block.pokemons)  // the first time there is not a previous next_block
		{
			game.block = game.next_block;

			// if block can not be placed at start area, the game is over
			if (! game.can_be_placed_at(game.start.x, game.start.y))
				return game.game_over();

			// place block at start area
			game.place(game.start.x, game.start.y);
		}

		game.next_block = g_blocks_creator.get_random_block();

		board.draw_block_at_next(game.next_block);

		// reset the score for the next block
		game.reset_score();

		// reset timer for the next block
		game.reset_timer();
	},

	/**
	 * Game over, man.
	 */
	game_over: function()
	{
		clearInterval(game.move_loop);
		clearInterval(game.timer);
		game.game_is_over = true;

		// draws GAME OVER and the high scores
		scores.draw_high_scores();

		return false;
	}

});

game = new GameEngineClass();


