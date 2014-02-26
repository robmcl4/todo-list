/**
 * API Reference
 * 
 * Weather.bindDayNight(selector)
 *  -> Given a jquery selector, bind this to day-night changes
 *
 * Weather.bindSummary(selector)
 *  -> Binds an element to a weather summary, updating periodically
 * 
 * Weather.go()
 *  -> Start the script
 */

window.Weather = new Object();

Weather.__location__ = '14623';
Weather.__apiloc__   = '//query.yahooapis.com/v1/public/yql';
Weather.__styling__  = '<link rel="stylesheet" href="static/styles/weather.css">';
Weather.__updateStarted__ = false;
/**
 * Holds references to bound elements.
 * Ex: 
 * [ ["daynight", <div>], ...]
 */
Weather.__bindings__ = [];

/**
 * The Day-Night sensor section
 *   Used for the day-night background feature
 */

// Bind a new day-night element, replace old one if exists
Weather.bindDayNight = function(selector) {
	var elem = $(selector);
	// Store for later recal
	Weather.__bindings__.push(['daynight', elem]);
	// Add the appropriate class
	elem.addClass('Weather-daynight');
};


// Updates the day/night and handles the ajax to get the info
// TODO encapsulate the ajax somewhere else
Weather.__updateDaynight__ = function(elem) {
	var d = new Date();
	// If we need to freshen the data
	if (typeof Weather.__suntime__ == 'undefined' ||
		 (Weather.__suntime__[3] != d.getDate())) {
		var data = null;
		$.ajax({
			type : 'get',
			async: false,
			url  : Weather.__apiloc__,
			data : {
						q: 'select astronomy from weather.forecast where location=\'' + Weather.__location__ + '\'',
						format:'json'
					 }
		}).done(function(returned) {
			if (typeof returned == 'string') returned = JSON.parse(returned);
			data = returned;
		});
		var times = data['query']['results']['channel']['astronomy']
		var sunrise = times['sunrise']
		var sunset  = times['sunset']

		sunrise = sunrise.substr(0, sunrise.length-3);
		sunset  = sunset.substr(0, sunset.length-3);

		sunrise = sunrise.split(':');
		sunset  = sunset.split(':');
			
		sunrise = [parseInt(sunrise[0]), parseInt(sunrise[1])]
		sunset  = [parseInt(sunset[0])+12, parseInt(sunset[1])]
		
		Weather.__suntime__ = [sunrise, sunset, d.getDate()];
	}
	
	// Utility function used in a few lines
	function isAfter(hours, minutes) {
		var day = new Date();
		return (day.getHours() > hours) || 
					 (day.getHours() == hours && day.getMinutes() >= minutes);
	}
	
	var sunrise = Weather.__suntime__[0];
	var sunset  = Weather.__suntime__[1];

	function setDaytime(elem) {
		if(elem.hasClass('Weather-nighttime')) {
			elem.toggleClass('Weather-nighttime Weather-daytime');
		}
		else {
			elem.addClass('Weather-daytime');
		}
	}
	function setNighttime(elem) {
		if(elem.hasClass('Weather-daytime')) {
			elem.toggleClass('Weather-daytime Weather-nighttime');
		}
		else {
			elem.addClass('Weather-nighttime');
		}
	}

	if(isAfter(sunrise[0], sunrise[1])) { // If it is after sunrise
		if(isAfter(sunset[0], sunset[1])) { // If it is after sunset
			setNighttime(elem); // It is after sunset
		}
		else {
			setDaytime(elem); // It is the day
		}
	}
	else {
		setNighttime(elem); // It is before sunrise
	}
};

/**
 * Summary section
 *  used for summarizing the weather in a div
 *
 */

Weather.bindSummary = function(selector) {
	var elem = $(selector);
	elem.addClass('Weather-summary');
	Weather.__bindings__.push(['summary', elem]);
};

Weather.__updateSummary__ = function(elem) {
	if(Weather.__tick__ % 100 != 0) return;
	
	var data = null;
	console.log("Getting");
	$.ajax({
		type : 'get',
		async: false,
		url  : Weather.__apiloc__,
		data : {
					q: 'select * from weather.forecast where location=\'' + Weather.__location__ + '\'',
					format:'json'
				 }
	}).done(function(returned) {
		if (typeof returned == 'string') returned = JSON.parse(returned);
		data = returned;
	});
	console.log(data)
	data = data['query']['results']['channel'];
	
	function getElem(parent_, class_) {
		var ret = parent_.find("." + class_);
		if (ret.length <= 0) {
			ret = $("<div class='" + class_ + "'>");
			parent_.append(ret);
		}
		return ret;
	}

	var currTemp = getElem(elem, "Weather-currTemp");
	var highLow  = getElem(elem, "Weather-highLow");
	var windSpeed= getElem(elem, "Weather-windSpeed");
	var humidity = getElem(elem, "Weather-humidity");
	var desc     = getElem(elem, "Weather-description");
	
	currTemp.html(data['item']['condition']['temp'] + '/' +
								data['wind']['chill'] + ' &deg;F');
	highLow.html(data['item']['forecast']['0']['high'] + '/' +
	             data['item']['forecast']['0']['low'] + ' &deg;F');
	windSpeed.html(data['wind']['speed'] + 'mph');
	humidity.html(data['atmosphere']['humidity'] + '%');
	desc.html(data['item']['condition']['text']);
};

/**
 * Driver Section
 *  Called periodically to update information.
 *  Use Weather.go() to start it
 */

Weather.go = function() {
	if(!Weather.__updateStarted__){
		setTimeout(function() {
		Weather.__tick__ = 0;
		$('head').append(Weather.__styling__);
		Weather.__updateStarted__ = true;
		Weather.__update__();
		}, 2);
	}
}

Weather.__update__ = function() {
	var bindings = Weather.__bindings__;
	for(var i=0; i<bindings.length; i++) {
		if(bindings[i][0]=='daynight') Weather.__updateDaynight__(bindings[i][1]);
		if(bindings[i][0]=='summary') Weather.__updateSummary__(bindings[i][1]);
	}
	Weather.__tick__ += 1;
	Weather.__tick__ %= 1000;
	setTimeout(Weather.__update__, 10000);
};
