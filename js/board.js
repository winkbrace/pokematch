/**
 * Board class to represent the play board
 * board is responsible for drawing on the board.
 * @author Bas de Ruiter
 */
BoardClass = Class.extend({

	// set up the board
	'width': 7 * 40,
	'height': 11 * 40,
	'tilesize': 40, // width and height of a tile in the grid
    // top left pixel - to be set by init()
    'x': 0,
	'y': 0,

    'canvas_top_margin': 0,
    'canvas_left_margin': 0,

	// array to store all the generated blocks in
	blocks: [],

	// timer pattern
	timer_pattern: null,

	// init
	init: function ()
	{
		this.x = Math.floor((canvas.width - this.width) / 2);
		this.y = 0;

        var style = window.getComputedStyle(document.getElementById("canvas_container"));
        this.canvas_left_margin = parseInt(style.marginLeft);
        this.canvas_top_margin = parseInt(style.marginTop);

        // create timer pattern
        this.timer_pattern = $("#canvas").createPattern({
            // Define width/height of pattern (before repeating)
            width:  20,
            height: 20,
            source: function(context) {
                // Draw striped background (which will repeat)
                $(this).drawRect({
                    fillStyle: "#F5001C",
                    x: 0,
                    y: 0,
                    width:20,
                    height:20,
                    fromCenter: false
                }).drawVector({
                    strokeStyle: "#F18518",
                    strokeWidth: 8,
                    x:4, y:24,
                    a1:24, l1:30
                });
            }
        });

        // create tile lines background
        for (var x = this.x - 0.5; x <= this.width + this.tilesize; x += this.tilesize) {
            ctxbg.beginPath();
            ctxbg.moveTo(x, this.y);
            ctxbg.lineTo(x, this.height + this.y);
            ctxbg.stroke();
        }
        for (var y = this.y + 0.5; y <= this.height + this.tilesize; y += this.tilesize) {
            ctxbg.beginPath();
            ctxbg.moveTo(this.x, y);
            ctxbg.lineTo(this.width + this.x, y);
            ctxbg.stroke();
        }
	},

	/**
	 * function to draw a tile on the canvas
	 * @param color
	 * @param nx - number of squares in x direction
	 * @param ny - number of squares in y direction
	 */
	draw_pokemon: function(color, nx, ny)
	{
		var pos_x = this.x + (this.tilesize * nx);
		var pos_y = this.y + (this.tilesize * ny);

		// fetch the tile object to draw with details on where it is on the spritesheet
		var pokemon = g_spritesheet.get_pokemon_img(color);
		ctx.drawImage(g_spritesheet.img, pokemon.x, pokemon.y, pokemon.w, pokemon.h, pos_x, pos_y, this.tilesize, this.tilesize);
	},

	draw_grid: function(grid)
    {
        for (var x = 0; x < grid.length; x++) {
            for (var y = 0; y < grid[x].length; y++) {
                board.draw_pokemon(grid[x][y]['pokemon'], x, y);
            }
        }
    },

	/**
	 * draw empty area
	 */
	draw_empty: function(x, y, w, h)
	{
		ctx.clearRect(x, y, w, h);
	},

	/**
	 * remove a tile from the board
	 * @param nx - number of tiles in x direction
	 * @param ny - number of tiles in y direction
	 */
	clear_tile: function(nx, ny)
	{
		var x = board.x + (nx * this.tilesize);
		var y = board.y + (ny * this.tilesize);
		this.draw_empty(x, y, this.tilesize, this.tilesize);
	},

	/**
	 * draw floating score
	 */
	draw_score: function(score, nx, ny)
	{
		var x = board.x + (nx * this.tilesize) - 10;
		var y = board.y + (ny * this.tilesize) - 30;

		// draw floating score with setInterval.
		var i=0;
		var interval = setInterval(function() {
            var canvas = document.getElementById('score');
            ctxs = canvas.getContext('2d');

            // first clear score canvas
            $(canvas).clearCanvas();

		    // draw score
			ctxs.font = "bold 40px Arial";
			ctxs.fillStyle = "red";
			ctxs.strokeStyle = "black";
			ctxs.strokeWidth = 1;
			ctxs.fillText(canvas, x, y+50-(3*i));
			ctxs.strokeText(canvas, x, y+50-(3*i));

			// after a few iterations remove the score
			if (++i == 10) {
				$(canvas).clearCanvas();
				clearInterval(interval); // stop interval
			}
		}, 100);
	},

	/**
	 * draw total score in score area
	 */
	draw_total_score: function(score)
	{
		var x = this.x;
		var y = 440;
		var w = 175;
		var h = 40;

		ctx.clearRect(x, y, w, h);

		ctx.font = "bold 40px Arial";
		ctx.textAlign = "right";
		ctx.textBaseline = "top";
		ctx.fillStyle = "red";
		ctx.strokeStyle = "black";
		ctx.strokeWidth = 1;
		ctx.fillText(score, x+w, y);
		ctx.strokeText(score, x+w, y);
	},

    /**
     * draw the timer at the given percentage
     */
    draw_timer: function(percentage)
    {
        var x = this.x;
        var y = (this.y + this.height + this.tilesize);
        var w = Math.floor(this.width * percentage);
        var h = 20;

        ctx.clearRect(x, y, this.width, h);

        $("#canvas").drawRect({
            fillStyle: this.timer_pattern,
            x: x,
            y: y,
            width: w,
            height: h,
            cornerRadius: 2,
            fromCenter: false
        });
    }

});

var board = new BoardClass();
