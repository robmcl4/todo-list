var Clock = Object();

Clock.__elem__ = null;
Clock.__currvals__ = [-1, -1, -1, -1, -1, -1];
Clock.__paused__ = false;

Clock.bindClock = function(selector) {
	Clock.__elem__ = $(selector);
	var elem = Clock.__elem__;

	var digits = [];

	for(var i=0; i<6; i++) { // Loop over all the digits
		// A container for the children
		var parentDiv = $(document.createElement('div'));
		parentDiv.attr('id', 'clock-digit-' + i);

		// To keep track of the children, will be pushed to digits[]
		var childElems = []; 


		for(var j=0; j<2; j++) { // Create 2 sub-digits (for flipping)
			var id  = 'clock-digit-' + i + '-' + j%2;
			var div = $(document.createElement('div'));
			if (j%2 == 1) {
				div.addClass('clock-hidden');
			}
			else {
				div.html('8');
			}
			div.attr('id', id);
			childElems.push(div);
			parentDiv.append(div);
		}

		if (i != 0 && i%2 == 0) {
			elem.append('<div class="clock-sep"><div>:</div></div>');
		}
		elem.append(parentDiv);
		childElems.push(parentDiv);
		digits.push(childElems);
	}

	Clock.__digits__ = digits;

	Clock.__driver__();
}

// To pause/resume clock changing
Clock.pause = function() {
	Clock.__paused__ = true;
}
Clock.resume = function() {
	Clock.__paused__ = false;
}

// Change an element of the clock to a different digit
Clock.__changeTo__ = function(elem, newVal) {
	var fadingIn 	= $(elem).find('.clock-hidden');
	var fadingOut = $(elem).find(':not(.clock-hidden)');
	fadingIn.html(newVal);
	fadingIn.addClass('droppingIn');
	fadingOut.addClass('droppingOut');
	setTimeout(function() {
		fadingIn.removeClass('droppingIn');
		fadingIn.removeClass('clock-hidden');
		fadingOut.removeClass('droppingOut');
		fadingOut.addClass('clock-hidden');
	}, 500);
}

Clock.__driver__ = function() {
	// Do nothing if paused
	if (Clock.__paused__) {
		setTimeout(Clock.__driver__, 1000);
		return;
	}

	var d = new Date();

	function checkAndChange(digitIndex, valToUse) {
		if (valToUse != Clock.__currvals__[digitIndex]) {
			Clock.__changeTo__(Clock.__digits__[digitIndex][2], valToUse);
			Clock.__currvals__[digitIndex] = valToUse;
		}
	}
	var currHour = Math.floor(d.getHours())%12;
	if (currHour == 0) currHour = 12;
	checkAndChange(0, Math.floor(currHour/10));
	checkAndChange(1, currHour%10);
	checkAndChange(2, Math.floor(d.getMinutes()/10));
	checkAndChange(3, d.getMinutes() % 10);
	checkAndChange(4, Math.floor(d.getSeconds()/10));
	checkAndChange(5, d.getSeconds() % 10);

	setTimeout(Clock.__driver__, 1000);

}
