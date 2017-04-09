/**
 * @author Bas de Ruiter
 */

/**
 * Class to access the images in the spritesheet downloaded from https://veekun.com/static/pokedex/downloads/
 */
SpriteSheet = Class.extend({

	// the source image
	img: null,

	// the source image url
	url: "",

	// array of pokemons image objects
	pokemons: [],

	// init
	init: function () {},

	// Load the atlas at the path 'imgName' into
    // memory. This is similar to how we've
    // loaded images in previous units.
	load: function(img_url, atlas)
	{
		// Store the URL of the spritesheet we want.
        this.url = img_url;

        // Create a new image whose source is at 'imgName'.
		var img = new Image();
		img.src = img_url;
		this.img = img;

        // width and height are equal for each tile and therefore defined only once
        var w = atlas.width;
        var h = atlas.height;

        var data, pokemon;

        // loop through each tile and create a Tile object to store in the pokemons array
        for (var key in atlas.pokemons)
    	{
        	data = atlas.pokemons[key];
        	pokemon = {
    			"color": key,
    			"w": w,
    			"h": h,
    			"x": data.nx * w,
    			"y": data.ny * w
        	};
        	this.pokemons.push(pokemon);
    	}
	},

	// get a pokemon object by color
	get_pokemon_img: function(color)
	{
		// loop through the pokemons and return the one with the matching color
        for (var i = 0; i < this.pokemons.length; i++) {
			var pokemon = this.pokemons[i];
			if (pokemon.color == color)
				return pokemon;
		}

		// return null when nothing found
		return null;
	}

});

// define the pokemons atlas
var atlas = {
	"width": 80,
    "height": 80,
    "pokemons": {
    	"green": 	{"nx": 2, "ny": 0},
    	"orange": 	{"nx": 5, "ny": 0},
        "blue": 	{"nx": 8, "ny": 0},
        "purple": 	{"nx": 5, "ny": 1},
        "yellow":	{"nx": 9, "ny": 1},
        "grey": 	{"nx": 11, "ny": 2}
    }
};

// create the SpriteSheet object
var g_spritesheet = new SpriteSheet();
g_spritesheet.load('img/platinum.png', atlas);

