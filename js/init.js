/**
 * @author Bas de Ruiter
 *
 * set all init values and stuff ;)
 */

// background canvas
$('#background').drawImage({
	source: "img/blank.png",
	fromCenter: false
});

// main canvas
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
// background
var ctxbg = document.getElementById('background').getContext('2d');

const environment = 'local';
function dump()
{
    if (environment == 'local') {
        console.log(arguments);
    }
}
