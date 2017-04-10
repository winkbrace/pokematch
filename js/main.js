/**
 * start the game
 */

$(document).ready(function()
{
    // make sure the loading screen is loaded first
    var img = new Image();
    img.onload = function()
    {
        var assets_to_load = [
            // images
            "img/platinum.png",

            // the actual game scripts
            "js/board.js",
            "js/game_engine.js",
            "js/sound_effects.js",
            "js/scores.js",
            "js/input_engine.js"
        ];

        // load all assets
        // first the images, then the scripts, to enforce spritesheet.js will work properly
        loadAssets(assets_to_load, function() {
            // place the ENTER button when all assets have been loaded
            // $('#background').drawImage({
            //     source: "img/enter.png",
            //     x: 0, y: 380,
            //     fromCenter: false
            // });
            board.draw_pokemon('blue', 1, 1);
            board.draw_pokemon('orange', 2, 1);
        });
    };
    img.src = "img/blank.png";


});
