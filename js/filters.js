//filters.js
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
filterCoordinates.minLat = 0;
filterCoordinates.maxLat = 0;
filterCoordinates.minLong = 0;
filterCoordinates.maxLong = 0;
filterCoordinates.run = function(entry){
	return entry[reclat] <= maxLat && entry[reclat] >= minLat && entry[reclong] <= maxLong && entry[reclong] >= minLong; 
};

var filterByMass = new Filter();
filterByMass.minMass = 0;
filterByMass.maxMass = 0;
filterByMass.run = function(entry){
	return entry[mass] <= maxMass && entry[mass] >= minMass;
};

var filterByDate = new Filter();
filterByDate.minDate = 0;
filterByDate.maxDate = 0;
filterByDate.run = function(entry){
	return entry[year] <= maxDate && entry[year] >= minDate;
};

var filterForExtremeValues = new Filter();
filterForExtremeValues.init = function(collection){
	this.stdev = getStandardDeviation(collection);
	this.medMass = getMedianMass(collection, 0, collection.length);
};
filterForExtremeValues.run = function(entry){
	return entry[mass] > this.medMass + this.stdev || entry[mass] < this.medMass - this.stdev;
};

var filterForStandardValues = new Filter();
filterForStandardValues.init = function(collection){
	this.stdev = getStandardDeviation(collection);
	this.medMass = getMedianMass(collection, 0, collection.length);
};
filterForStandardValues.run = function(entry){
	return entry[mass] < this.medMass + this.stdev || entry[mass] > this.medMass - this.stdev;
};

var filterForInterquartileValues = new Filter();


var filterForExtraquartileValues = new Filter();