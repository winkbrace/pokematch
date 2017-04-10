/**
 * class to handle user input
 * For this game it is better to have the action immediately tied to the swipe,
 * because blocks don't move with a vector, but with steps of a tile length.
 * The game engine is therefore not requesting this actions status in a continues update loop,
 * but this input engine will send a request to the game engine on swipe.
 */
InputEngineClass = Class.extend({

	// A dictionary mapping actions that might be taken in our
	// game to a boolean value indicating whether that action
	// is currently being performed.
	actions: {},

    movement: {
        threshold: 20, // minimum amount of pixels to be considered a move.
        direction: "",
        start:     {"x": 0, "y": 0},
        end:       {"x": 0, "y": 0}
    },

	//-----------------------------
	setup: function ()
    {
        var container = $("#canvas_container");
        container.on('click', gInputEngine.onClick);
        container.on('mousemove', gInputEngine.onMouseMove);

        document.getElementById('canvas_container').addEventListener('touchstart', gInputEngine.onTouchStart);
        document.getElementById('canvas_container').addEventListener('touchmove', gInputEngine.onTouchMove);
        document.getElementById('canvas_container').addEventListener('touchend', gInputEngine.onTouchEnd);
	},

	onTouchStart: function(event)
    {
        gInputEngine.movement.start.x = event.touches[0].clientX;
        gInputEngine.movement.start.y = event.touches[0].clientY;

        event.preventDefault();
    },

    onTouchMove: function(event)
    {
        // TODO should show the result when the move is done

        event.preventDefault();
    },

    onTouchEnd: function(event)
    {
        gInputEngine.movement.end.x = event.changedTouches[0].clientX;
        gInputEngine.movement.end.y = event.changedTouches[0].clientY;

        if (! gInputEngine.isAMove()) {
            return false;
        }
        gInputEngine.determineDirection();



        event.preventDefault();
    },

    /**
     * a touchmove is only considered a move if the amount of movement exceeds the defined threshold.
     */
    isAMove: function()
    {
        var m = gInputEngine.movement;

        if (! m.start.x || ! m.start.y) {
            dump('Error - touch move without touch start.');
            return false;
        }

        return Math.abs(m.end.x - m.start.x) > m.threshold || Math.abs(m.end.y - m.start.y) > m.threshold;
    },

    determineDirection: function()
    {
        var m = gInputEngine.movement;
        var dx = m.end.x - m.start.x;
        var dy = m.end.y - m.start.y;

        if (Math.abs(dx) > Math.abs(dy)) { // most significant direction
            m.direction = dx < 0 ? 'left' : 'right';
        } else {
            m.direction = dy < 0 ? 'up' : 'down';
        }
    },

	onMouseMove: function(event)
	{
		var x = event.offsetX;
		var y = event.offsetY;

		if (gInputEngine.button_new_game(x, y) ||
				gInputEngine.button_options(x, y) ||
				gInputEngine.button_resume(x, y) ||
				gInputEngine.button_enter(x, y) ||
				gInputEngine.button_again(x, y) ||
				gInputEngine.button_submit(x, y)
			)
			$(this).css({'cursor':'pointer'});
		else
			$(this).css({'cursor':'auto'});
	},

	onClick: function (event)
	{
		var x = event.offsetX;
		var y = event.offsetY;

		// main screen
		if (gInputEngine.button_new_game(x, y))
			game.new_game();

		// loading & credits screen
		else if (gInputEngine.button_enter(x, y))
			game.start_game();

		// again (= new game) on game over screen
		else if (gInputEngine.button_again(x, y))
			game.new_game();

		// submit high score on game over screen
		else if (gInputEngine.button_submit(x, y))
			scores.submit_score();

	},

	button_new_game: function(x, y) {
		return (x >= 28 && x <= 111 && y >= 56 && y <= 80 && ! game.paused && ! game.loading);
	},

	button_options: function(x, y) {
		return (x >= 124 && x <= 209 && y >= 59 && y <= 82 && ! game.paused && ! game.loading);
	},

	button_resume: function(x, y) {
		return (x >= 115 && x <= 207 && y >= 375 && y <= 397 && game.paused);
	},

	button_enter: function(x, y) {
		return (x >= 120 && x <= 208 && y >= 388 && y <= 422 && game.loading);
	},

	button_again: function(x, y) {
		return (x >= 208 && x <= 296 && y >= 438 && y <= 463 && ! game.loading && game.game_is_over && ! game.has_high_score);
	},

	button_submit: function(x, y) {
		return (x >= 208 && x <= 296 && y >= 438 && y <= 463 && ! game.loading && game.game_is_over && game.has_high_score);
	},

});

gInputEngine = new InputEngineClass();
gInputEngine.setup();
