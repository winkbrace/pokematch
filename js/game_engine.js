/**
 * GameEngineClass
 * The controller class.  Looks for actions to execute and delegates them to other classes.
 * game is responsible for knowing what tile is where on the board
 * @author Bas
 */
GameEngineClass = Class.extend({

	// pokemon pokemon
	active: {"pokemon": '', "x": 0, "y": 0},

	// array of the tiles and the pokemon they contain
	grid: [],

	// total score
	total_score: 0,

    loading: true,

	game_is_over: true,

	has_high_score: false,

    // the start game action when user taps [START] after loading has finished
    start_game: function() {
        // draw background canvas
        $('#background').clearCanvas().drawImage({
            source: "img/blank.png",
            fromCenter: false
        });

        game.loading = false;

        // then start the game
        game.new_game();
    },

	// set up for a new game
	new_game: function()
	{
		// reset grid array
		game.reset_grid();
		game.fill_grid();

		// clear active pokemon
		game.active = {"pokemon": '', "x": 0, "y": 0};

		// clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		$("#popup").clearCanvas();

		// setup new board
		board.init();
		board.draw_grid(game.grid);

		// draw inital score of 0
		game.total_score = 0;
		board.draw_total_score(0);

		game.game_is_over = false;
		game.has_high_score = false;
	},

	// reset grid array
	reset_grid: function()
	{
		var tx = board.width / board.tilesize;  // # tiles in x direction
		var ty = board.height / board.tilesize; // # tiles in y direction
        for (var x = 0; x < tx; x++) {
            game.grid[x] = [];
            for (var y = 0; y < ty; y++) {
                game.grid[x][y] = {'x': x, 'y': y};
            }
        }
	},

	fill_grid: function()
	{
        var tx = board.width / board.tilesize;  // # tiles in x direction
        var ty = board.height / board.tilesize; // # tiles in y direction
        for (var x = 0; x < tx; x++) {
            for (var y = 0; y < ty; y++) {
                game.grid[x][y]['pokemon'] = g_spritesheet.get_random_pokemon();
            }
        }
	},

	set_active: function (tap)
	{
	    // determine grid location of tap
		var x = Math.floor((tap.x - board.x - board.canvas_left_margin) / board.tilesize);
		var y = Math.floor((tap.y - board.y - board.canvas_top_margin) / board.tilesize);

		if (! game.grid[x] || ! game.grid[x][y]) {
		    dump(x, y, game.grid);
		    return;
        }

		game.active = {"pokemon": game.grid[x][y]['pokemon'], "x": x, "y": y};
		dump(tap.x, x, tap.y, y, game.active.pokemon);
	},

	// move a pokemon on the board
	move: function(x, y)
	{
		// remove pokemon from grid. The test if can_be_placed_at new location will then
		// not look at the space our pokemon is currently occupying
		game.remove_from_grid();

		// test if pokemon can be placed at new location
		if (game.can_be_placed_at(x, y))
		{
			game.clear_tiles();

			// move pokemon
			game.place(x, y);
			sfx.play('move');
		}
		else
		{
			// put pokemon back on grid
			game.place_on_grid();
			sfx.play('error');
		}
	},

	/**
	 * place the pokemon on the given location
	 * @param x
	 * @param y
	 */
	place: function(x, y)
	{
		// set new location
		game.active.x = x;
		game.active.y = y;

		// place pokemon on grid at new location
		game.place_on_grid();

		// draw pokemon at new location
		board.draw_pokemon(game.pokemon, game.active.x, game.active.y);
	},

	/**
	 * check if all pokemons of this pokemon can be placed at the given location
	 * @param x
	 * @param y
	 * @returns {Boolean}
	 */
	can_be_placed_at: function(x, y)
	{
	    return (game.grid[x] !== undefined && game.grid[x][y] !== undefined)
	},

	/**
	 * remove pokemon from grid only
	 */
	remove_from_grid: function()
	{
		game.grid[game.active.x][game.active.y][pokemon] = null;
    },

	/**
	 * place pokemon on grid only
	 */
	place_on_grid: function(x, y)
	{
        game.grid[x][y][pokemon] = game.active.pokemon;
	},

	/**
	 * execute the player input
	 * moves are executed in the move_loop. The other actions are executed on keydown
	 */
	execute_input: function(action)
	{
		if (game.paused && action != 'pause' && action != 'toggle-sound')
			return null;

		// get pokemon location locally for easier typing ;P
		var x = game.pokemon_location.x;
		var y = game.pokemon_location.y;

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
				if (! (game.pokemon_location.x == game.start.x && game.pokemon_location.y == game.start.y))
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
	 * put the pokemon down and check if a match is made
	 */
	put_down: function()
	{
		sfx.play('place');

		// TODO find match and set score
        var score = 0;

		// add score to total_score
		game.total_score += score;
		board.draw_total_score(game.total_score);

		game.roll_next_pokemon();
	},

	/**
	 * remove a tile from the board and the grid.
	 */
	remove_tile: function(tile)
	{
		tile = copy(tile); // create a copy, because tile is the reference to grid[x][y]

		// remove from grid
		game.grid[tile.x][tile.y] = {'x':tile.x, 'y':tile.y};
		// remove from board
		board.clear_tile(tile.x, tile.y);

		return tile; // return the tile, because blobs or bombs have to be handled later in the calling function (remove_tiles)
	},

	/**
	 * roll a next pokemon. Will move pokemon next pokemon to start area and make it the pokemon pokemon.
	 */
	roll_next_pokemon: function()
	{
		if (game.next_active)  // the first time there is not a previous next_pokemon
		{
			game.pokemon = game.next_pokemon;

			// if pokemon can not be placed at start area, the game is over
			if (! game.can_be_placed_at(game.start.x, game.start.y))
				return game.game_over();

			// place pokemon at start area
			game.place(game.start.x, game.start.y);
		}

		game.next_pokemon = g_pokemons_creator.get_random_pokemon();

		board.draw_pokemon_at_next(game.next_pokemon);

		// reset the score for the next pokemon
		game.reset_score();

		// reset timer for the next pokemon
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
