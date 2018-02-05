//filters.js

//filter management
var filterCounter = 0;
var activeFilterMap = new Map();
function removeFilter(idNumber){
	var element = document.getElementById("filter" + idNumber);
	activeFilterMap.delete(idNumber);
	element.parentElement.removeChild(element);
}
function createNewFilter(){
	var id = parseInt(document.getElementById("filterCreator").value);
	var newFilter = null;
	switch(id){
		case 0:
		newFilter = filterCoordinates;
		break;
		case 1: 
		newFilter = filterByMass;
		break;
		case 2: 
		newFilter = filterByDate;
		break;
		case 3: 
		newFilter = filterForExtremeValues;
		break;
		case 4: newFilter = filterForStandardValues;
		break;
		case 5: newFilter = filterForInterquartileValues;
		break;
		case 6: newFilter = filterForExtraquartileValues;
		break;

	}
	if(newFilter != null){
		var filterID = filterCounter++;
		var content = "<b style=\"color: black\">" + newFilter.title + "</b><span style=\"float: right;\"><a href=\"javascript:removeFilter(" + filterID + ")\">[Remove]</a></span></br>\n" + newFilter.content;
		var filterDiv = document.createElement("div");
		filterDiv.setAttribute('class', 'filter');
		filterDiv.setAttribute('id', 'filter' + (filterID));
		filterDiv.innerHTML = content;
		document.getElementById("activeFilters").appendChild(filterDiv);
		activeFiltersMap.put(newFilter);
	}
}


function basicFilterFormat(inputCollection){
	var outputCollection = inputCollection;
	return outputCollection;
}
function Filter(){
	//Sets up any settigns for the filter that are based on the statistics of the set
	this.init = function(collection){

	};
	//returns true if the entry qualifies for the filter
	this.run = function(entry){
		return false;
	};
	this.title = "Placeholder Title"
	this.content = "temp content"
}
function filterCollection(collection, filter){
	var filtered = [];
	filter.init(collection);
	for(var i = 0;i < collection.length;i++){
		if(filter.run(collection[i])){
			filtered.push(collection[i]);
		}
	}
	return filtered;
}


var filterCoordinates = new Filter();
filterCoordinates.title = "Coordinates:";
filterCoordinates.content = "Min Latitude: <input type=\"text\" name=\"minLat\"> Max Latitude: <input type=\"text\" name=\"maxLat\"></br>Min Longitude: <input type=\"text\" name=\"minLong\"> Max Longitude: <input type=\"text\" name=\"maxLong\">";

filterCoordinates.minLat = 0;
filterCoordinates.maxLat = 0;
filterCoordinates.minLong = 0;
filterCoordinates.maxLong = 0;
filterCoordinates.run = function(entry){
	return entry[reclat] <= maxLat && entry[reclat] >= minLat && entry[reclong] <= maxLong && entry[reclong] >= minLong; 
};


var filterByMass = new Filter();
filterByMass.title = "Mass: ";
filterByMass.content="Min Mass: <input type=\"text\" name=\"minMass\"> Max Mass: <input type=\"text\" name=\"maxMass\">";
filterByMass.minMass = 0;
filterByMass.maxMass = 0;
filterByMass.run = function(entry){
	return entry[mass] <= maxMass && entry[mass] >= minMass;
};

var filterByDate = new Filter();
filterByDate.title = "Date: ";
filterByDate.content = "Min Date: <input type=\"date\" name=\"minDate\">  Max Date: <input type=\"date\" name=\"maxDate\">";
filterByDate.minDate = 0;
filterByDate.maxDate = 0;
filterByDate.run = function(entry){
	return entry[year] <= maxDate && entry[year] >= minDate;
};

var filterForExtremeValues = new Filter();
filterForExtremeValues.title = "Extereme Values (By Mass) Only";
filterForExtremeValues.content = "<i>Parameters automatically calculated</i>"
filterForExtremeValues.init = function(collection){
	this.stdev = getStandardDeviation(collection);
	this.medMass = getMedianMass(collection, 0, collection.length);
};
filterForExtremeValues.run = function(entry){
	return entry[mass] > this.medMass + this.stdev || entry[mass] < this.medMass - this.stdev;
};

var filterForStandardValues = new Filter();
filterForStandardValues.title = "Standard Values (By Mass) Only";
filterForStandardValues.content = "<i>Parameters automatically calculated</i>";
filterForStandardValues.init = filterForExtremeValues.init;
filterForStandardValues.run = function(entry){
	return entry[mass] < this.medMass + this.stdev || entry[mass] > this.medMass - this.stdev;
};

var filterForInterquartileValues = new Filter();
filterForInterquartileValues.title = "Interquartile Range (By Mass)";
filterForInterquartileValues.content = "<i>Parameters automatically calculated</i>";
filterForInterquartileValues.init = function(collection){
	var range = getInterquartileRange(collection);
	this.low = range.lower;
	this.high = ranger.upper;
}
filterForInterquartileValues.run = function(entry){
	return entry[mass] < this.high && entry[mass] > this.low;
}

var filterForExtraquartileValues = new Filter();
filterForExtraquartileValues.title = "1st and 4th quartiles (By Mass)";
filterForExtraquartileValues.content = "<i>Parameters automatically calculated</i>";
filterForExtraquartileValues.init = filterForInterquartileValues.init;
filterForExtraquartileValues.run = function(entry){
	return entry[mass] > this.high || entry[mass] < this.low;
}

