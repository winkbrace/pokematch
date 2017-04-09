/**
 * SoundEffectsClass
 * Class to play sound effects
 * @author Bas
 */
SoundEffectsClass = Class.extend({
	
	// object with audio elements for playing the sounds. One audio for each sound.
	sounds: {},
	
	// the best supported mime type for the user's browser
	mime: '',
	file_extension: '',
	
	// sound on or off?
	silent: false,
	
	// setup
	setup: function() {
		
		sfx.set_mime();
		
		sfx.sounds.move  = new Audio('sounds/move.'+sfx.file_extension); 
		sfx.sounds.place = new Audio('sounds/place.'+sfx.file_extension);
		sfx.sounds.error = new Audio('sounds/error.'+sfx.file_extension);
		sfx.sounds.bomb  = new Audio('sounds/bomb.'+sfx.file_extension);
		sfx.sounds.score = new Audio('sounds/score.'+sfx.file_extension);
	},

	// this function will determine the smallest sound mime type supported by the browser
	set_mime: function() {
		// set mime type
		var audio = new Audio();
		var mime_types = ['audio/mpeg', 'audio/ogg', 'audio/wav']; // smallest to largest sound file type
		for (var i=0; i<mime_types.length; i++) {
			if (audio.canPlayType(mime_types[i])) {
				sfx.mime = mime_types[i];
				break;
			}
		}
		
		// set file_extension
		switch (sfx.mime) {
			case 'audio/mpeg': sfx.file_extension = 'mp3'; break;
			case 'audio/ogg': sfx.file_extension = 'ogg'; break;
			case 'audio/wav': sfx.file_extension = 'wav'; break;
		}
	},
	
	play: function(sound)
	{
		if (! sfx.silent) {
			sfx.sounds[sound].currentTime = 0;
			sfx.sounds[sound].play();
		}
	}
});

var sfx = new SoundEffectsClass();
sfx.setup();

