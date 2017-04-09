/**
 * @author Bas
 * The Scores class is used for submitting scores and fetching and drawing high scores
 */

pctx = document.getElementById('popup').getContext('2d');

ScoresClass = Class.extend({
	
	player_name: '',
	
	
	setup_font: function()
	{
		pctx.textBaseline = "bottom";
		
		// add shadow effect to all text
		pctx.shadowColor = "black";
		pctx.shadowOffsetX = 2;
		pctx.shadowOffsetY = 2;
		pctx.shadowBlur = 3;
	},
	
	
	submit_score: function() 
	{
		// prevent doublepost
		if (! game.has_high_score)
			return;
		game.has_high_score = false;
		$("#popup").drawImage({
  			source: "img/game_over_no_button.png",
  			fromCenter: false,
  			x: 200, y: 435
  		});
		
		$("#loader_gif").show();
		
		// get player_name
		var player_name = $('#player_name').val();
		
		// store the name and score
		$.getJSON("ajax/submit_score.php?score="+encodeURIComponent(game.total_score)+"&name="+encodeURIComponent(player_name), function(data) {
			// reset stuff for redrawing the high scores view
			game.total_score = 0;
			$("#player_name").remove();
			
			// redraw high_scores
			scores.draw_high_scores();	
		});
	},
	
	
	draw_high_scores: function()
	{
		// draw scores screen
		$("#popup").drawImage({
  			source: "img/game_over.png",
  			fromCenter: false
  		});
		
		// draw loading gif
		if (! $("#loader_gif").length)
			$('#canvas_container').append('<img id="loader_gif" src="img/loader.gif" />');
		$("#loader_gif").show();
		
		scores.setup_font();
		
		$.getJSON("ajax/get_scores.php?player_score="+encodeURIComponent(game.total_score), function(high_scores) 
		{
			$("#loader_gif").hide();
			
			// exit if there was an error fetching the scores
			if (high_scores.error)
				return;
			
			for (var i=0; i<high_scores.result.length; i++) {
				scores.draw_row(high_scores.result[i]);
				
				// check if player has high score
				if (high_scores.result[i].player_score)
					game.has_high_score = true;
			}
			
			// if player has high score draw message and submit field
			if (game.has_high_score)
			{
				$("#popup").drawImage({
		  			source: "img/high_score_text.png",
		  			fromCenter: false,
		  			y: 140
		  		}).drawImage({
		  			source: "img/enter_score.png",
		  			fromCenter: false,
		  			y: 380
		  		});
				
				$('#canvas_container').append('<input type="text" id="player_name" name="player_name" value="" />');
				$("#player_name").keyup(function() {
					scores.player_name = $(this).val();
					scores.draw_player_name();
				}).focus();
				// always keep focus on the "hidden" text input field
				$('#canvas_container').click(function() {
					$("#player_name").focus();
				});
				
			}
		});
		
	},
	
	
	draw_row: function(row)
	{
		// start x and y for this row
		var sx = 45;
		var sy = 190 + (row.rank - 1) * 20;
		
		// draw rank
		pctx.font = "bold 20px control_freak";
		pctx.textAlign = "left";
		pctx.fillStyle = "#f7941c";
		pctx.fillText(row.rank+".", sx, sy);
		
		// draw name
		pctx.font = "bold 16px control_freak";
		pctx.fillStyle = row.player_score ? "#f7941c" : "#fff200";  // player's substitute name "YOU" is orange, all others yellow
		pctx.fillText(row.name, sx+30, sy);
		
		// draw score
		pctx.textAlign = "right";
		pctx.fillText(row.score, 284, sy);
	},
	
	
	draw_player_name: function()
	{
		var x = 33;
		var y = 427;
		
		// 'clear' canvas
		$("#popup").drawRect({'x':31, 'y':407, 'width':258, 'height':20, 'fillStyle':"#A2A2A2", fromCenter:false});
		
		// draw name
		scores.setup_font();
		pctx.font = "bold 20px control_freak";
		pctx.textAlign = "left";
		pctx.fillStyle = "#f7941c";
		pctx.fillText(scores.player_name, x, y);
	}
	
});

var scores = new ScoresClass();
