var curr_elem = null;
var todos = null;
var newShown = false;
var infoShown = false;
var helpShown = false;
var transitioning = false;
var center = null;
var submitting = false; // this functions as a lock to prevent double-posting
var willBeWonky = true;

$(document).ready(function() {
	// Load the todos holder
	todos = $("#todos");
	
	center = $("#center");
	setTimeout( function() {
		center.css("max-height", center.height() + "px");
		willBeWonky = false;
	}, 200);

	// Focus the top initially
	var elemsearch = $(".todo-elem");
	if (elemsearch.length > 0) {
		var el = elemsearch[0];
		focusItem(el);
	}

	// Bind the keys
	$('body').keypress( function(ev) {
		// If this is the 'j' key, and the thing should be advanced
		if (newShown || infoShown || ev.ctrlKey || ev.altKey || ev.metaKey)
			return;
		
		ev.preventDefault();
		// If this is the lowercase 'j', go down one
		if (ev.which == 106) {
			if (curr_elem) {
				var next = curr_elem.next();
				while(next.hasClass("disabled")) {
					next = next.next();
				}
				if (next.hasClass("todo-elem")) {
					focusItem(next);
				}
			}
		}
		// If this is the 'k' key, and the thing should be wound back
		if (ev.which == 107) {
			if (curr_elem) {
				var prev = curr_elem.prev();
				while(prev.hasClass("disabled")) {
					prev = prev.prev();
				}
				if (prev.hasClass("todo-elem")) {
					focusItem(prev);
				}
			}
		}
		// This is capital J, which means go to the bottom
		if (ev.which == 74) {
			var elems = $(".todo-elem");
			if (elems.length > 0) {
				var i = elems.length-1;
				while(i >= 0 && $(elems[i]).hasClass("disabled"))
					i--;

				focusItem(elems[i]);
			}
		}
		// If this is capital K, go to top
		if (ev.which == 75) {
			var elems = $(".todo-elem");
			if (elems.length > 0) {
				var i = 0;
				while(i < elems.length && $(elems[i]).hasClass("disabled"))
					i++;
				focusItem(elems[i]);
			}
		}
		// h key pressed, hide this
		if (ev.which == 104) {
			if (curr_elem) {
				// Wait until transition done
				if (!transitioning) hideItem(curr_elem);
			}
		}
		// n key, show new
		if (ev.which == 110) {
			if (!newShown && !transitioning)
				toggleNew();
		}
		// i key, show info
		if (ev.which == 105) {
			if (!infoShown && !transitioning)
				toggleInfo();
		}
		// 'u' key, undoes hide
		if (ev.which == 117) {
			$.get("unhide", function(data) {
				window.location = ".";
			});
		}
		// 'l' key, logout
		if (ev.which == 108) {
			window.location = "logout";
		}
	});

	$("body").keyup(function(ev) {
		// If escape was pressed, toggle whatever is there
		if (ev.which == 27 && !transitioning) {
			hidePopup();
		}
	});

	$("#shade").dblclick(function(ev) {
		if (ev.target.id == 'shade')
			hidePopup();
	});
	
	// ------------------ EXTERNAL API BINDINGS --------------------
	// Load the clock 
	Clock.bindClock('#clock');
	Weather.bindDayNight("#weather");
	Weather.bindSummary('#weather');
	Weather.go();
});

function hidePopup() {
	if (newShown)
		toggleNew();
	else if (infoShown)
		toggleInfo();
	else if (helpShown)
		toggleHelp();
}

function togglePopup(id, fadingIn, setup) {
	if (transitioning) return;
	transitioning = true;
	var shade = $("#shade");
	var toShow = $("#" + id);
	if (!fadingIn) { // fade out
		shade.css("opacity", "0");
		setTimeout(function() {
			toShow.css("visibility", "hidden");
			shade.css("visibility", "hidden");
			if (Clock != undefined)
				Clock.resume()
			transitioning = false;
		}, 250);
	}
	else { // fade in
		if (Clock != undefined)
			Clock.pause();
		shade.css("visibility", "visible");
		toShow.css("visibility", "visible");
		setup();
		shade.css("opacity", "1");
		setTimeout(function() {
			transitioning = false;
		}, 250);
	}
}

function toggleNew() {
	if (infoShown || helpShown) return;
	togglePopup("newtodo", !newShown, function(){
		$("#newtitle").focus();
	});
	newShown = !newShown;
}

function toggleInfo() {
	if (newShown || !curr_elem || helpShown) return;
	togglePopup("info", !infoShown, function(){
		var info = $("#info");
		var title = curr_elem.find(".todo-title").html();
		var importance = curr_elem.find(".todo-importance").html();
		var daysleft = curr_elem.find(".todo-daysleft").html();
		var description = curr_elem.find(".desc").html();
		
		info.find("#info-title").html(title);
		info.find(".todo-importance").html(importance);
		info.find(".info-daysleft").html(daysleft + " Days Left");
		info.find("#description").html(description);
	});
	infoShown = !infoShown;
}

function toggleHelp() {
	if (newShown || infoShown) return;
	togglePopup("help", !helpShown, function(){});
	helpShown = !helpShown;
}

function focusItem(thing) {
	if (curr_elem) {
		curr_elem.removeClass("focused-elem");
	}
	var elem = $(thing);
	elem.addClass("focused-elem");
	curr_elem = elem;
}

function hideItem(thing) {
	transitioning = true;
	var elem = $(thing);
	var isBottom = false;

	// find the next element to focus on
	var next = elem.next();
	while (next.hasClass("disabled")) {
		next = next.next();
	}
	if (!next.hasClass("todo-elem")) {
		isBottom = true;
		next = elem.prev();
		while(next.hasClass("disabled")) {
			next = next.prev();
		}
		if (!next.hasClass("todo-elem")) {
			next = null;
		}
	}
	
	elem.addClass("fadeOut");
	var height = center.height();
	// center.css("height", height + "px");
	if (!center.hasClass("animate-height") && !willBeWonky) {
		center.addClass("animate-height");
	}
	if (!willBeWonky) {
		center.css("max-height", (height-57) + "px");
	}
	
	if (!isBottom) {
		var setNext = next;
		while (setNext && setNext.hasClass("todo-elem")) {
			setNext.addClass("slide");
			setNext = setNext.next();
		}
	}

	setTimeout( function() {
		curr_elem = null;
		elem.addClass("disabled");
		elem.removeClass("fadeOut");
		elem.removeClass("focused-elem");
		// center.css("max-height", "10000px");

		if (!isBottom) {
			setNext = next;
			while (setNext && setNext.hasClass("todo-elem")) {
				setNext.removeClass("slide");
				setNext = setNext.next();
			}
		}
		if (next) {
			focusItem(next);
		}
		transitioning = false;
		var id = elem.attr('id').substring(5)
		$.post('hide_todo', {idnum : id});
	}, 500);
}

function submitLock() {
	if (submitting) return false;
	else submitting = true;
	return true;
}
