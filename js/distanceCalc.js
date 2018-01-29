var doingChronoAnimation = true;
var workingAnimation = null;
var chronoAnimationSpeed = 100;
var USAHorizonScale = 40;
var USAVerticalScale = 20;
var USAGridRadius = 0; // This is set later
var database;
var subCollection;
var americanCollectionStore;
var t_lastClickPosition = -1;
var tempMapGrid;
var sqrtValuesOnMap = true;
var massDistributionChart;
var massDistributionChartExists = false;
var massGroupLineChart;
var autoFeedPosition = false;
var drawRanks = false;

var lastRankResolution = -1;
var lastRankings;

/*
*Loads the resource CSV and sanitizes it to remove any entries that cannot be used due to missing information
*/
function LoadFile() {
	$.get('/Meteorite_Landings.csv', function(result) {
		if (result == 'ON') {
			alert('ON');
		} else if (result == 'OFF') {
			alert('OFF');
		} else {
			database = CSVToArray(result);
			var newDatabase = [];
			var massCount = 0;
			var coordCount = 0;
			var timeCount = 0;
			var oLength = database.length;
				for(var c = 0;c < database.length;c++){
				database[c] = sanitizeData(database[c]);

				var addToList = true;
				if(database[c][mass] === "" || isNaN(database[c][mass])) {
					massCount++;
					addToList = false;
				}
				if(database[c][reclat]==="" || database[c][reclong] ==="" || isNaN(database[c][reclat]) || isNaN(database[c][reclong])) {
					coordCount++;
					addToList = false;
				}
				if(database[c][reclat] === 0 && database[c][reclong] === 0)
					addToList = false;
				if(isNaN(database[c][year].getTime())){
					timeCount++;
					addToList = false;
				}
				if(addToList)
					newDatabase.push(database[c]);
			}
			console.log("Excluded " + timeCount + " entries based on failed timestamps");
			console.log("Excluded " + massCount + " entries based on missing mass");
			console.log("Excluded " + coordCount + " entries based on missing GPS");
			console.log("Reduced database from " + oLength + " entries to " + newDatabase.length + " entries");
			database = newDatabase;
			//By default the data is sorted by mass
			database = database.sort(function(a, b){
				if(isNaN(a[mass])|| isNaN(b[mass])) {
					console.log("BWAAHAAHA");
					return -1;
				}
				if(a[mass] < b[mass]) return -1;
				if(a[mass] > b[mass]) return 1;
				return 0;
			});
			var sortedMassValues = [];
			for(var i = 0;i < database.length;i++){
				sortedMassValues.push(database[i][mass]);
			}
		}
		updateHeatmapParameters();
		drawMap(checkAmericanGrid());
		initListeners();
		document.getElementById("chronoPosSlider").max = getAmericanMeteorites().length - 1;
	});
}
/*
*Transmutes all the data on an entry into their usable data types
*/
function sanitizeData(entry){
	entry[mass] = parseFloat(entry[mass]); 
	entry[year] = new Date(entry[year]);
	entry[reclat] = parseFloat(entry[reclat]);
	entry[reclong] = parseFloat(entry[reclong]);
	return entry;
}
/*
*Sorts a collection by the date field
*/
function sortCollectionByDate(collection){
	return collection.sort(function(a, b){
		if(a[year] < b[year]) return -1;
		if(a[year] > b[year]) return 1;
		return 0;
	});
}
/*
*A class containing a pair of values to represent the upper and lower quartile values of the set
*/
function RangeSet(lower, upper){
	this.lower = lower;
	this.upper = upper;
	this.getRange = function(){
		return upper- lower;
	};
};
/*
* returns an array of entries from the provided collection that fall within maxDistance miles of the provided coordinates
*/
function getEntriesInRegion(lat, lon, maxDistance, collection){
	subCollection= [];
	for(var c = 0;c < collection.length;c++){
		if(collection[c][reclat] === "" || collection[c][reclong] === "") continue;
			var d = findDistance(lat, lon, collection[c][reclat], collection[c][reclong]);
		if(d <= maxDistance)
			subCollection.push(collection[c]);

	}
}
/*
*Fetches all american meteorites from the list and caches that list. The list should never change, so this helps to speed things up so
*I don't have to loop through 40k entries every time
*/
function getAmericanMeteorites(){
	if(americanCollectionStore != null){
		return americanCollectionStore;
	}
	var americanCollection = [];
	for(var i = 0;i < database.length;i++){
		if(database[i][mass]==="") continue;
		if(database[i][reclat] <= USAUpperLat && database[i][reclat] >= USALowerLat && database[i][reclong] <= USAUpperLong && database[i][reclong] >= USALowerLong){
			americanCollection.push(database[i]);
		}
	}
	americanCollectionStore = americanCollection;
	return americanCollection;
}
/*
* Returns the average distance of entries of a collection from a given coordinate point
*/
function getAverageDistance(lat, lon, collection){
	var average = 0;
	for(var c = 0;c < collection.length;c++){
		average += findDistance(lat, lon, collection[c][reclat], collection[c][reclong]);
	}
	return average / collection.length;
}
/*
* Returns the average mass of entries in a collection
*/
function getAverageMass(collection){
	if(collection.length === 0) return 0;
	var average = 0;
	for(var c = 0;c < collection.length;c++){
			average += collection[c][mass];
		}
	var ans = new Number(average / collection.length);
	ans.entries = collection.length;
	ans.min = 0;
	ans.max = Number.POSITIVE_INFINITY;
	return ans;
}
/*
* organizes entries of the american meteorites subset into a grid system
*/
function checkAmericanGrid(){
	var americanMeteorites = getAmericanMeteorites();
	var gridSections= [];
	//grid sections are stored from bottom left to top right, row by row
	//like so, ([0,0],[0,1],[1,0],[1,1])
	for(var y = 0;y < USAVerticalScale;y++){
		for(var x = 0;x < USAHorizonScale;x++){
			var latg1 = USALowerLat + (y + 0.5) * ((USAUpperLat - USALowerLat) / USAVerticalScale);
			var long1 = USALowerLong + (x + 0.5) * ((USAUpperLong - USALowerLong) / USAHorizonScale);
			getEntriesInRegion(latg1,long1,USAGridRadius, americanMeteorites);
			gridSections.push(subCollection);
			

		}
	}
	return gridSections;
}
function getInterquartileRange(collection){
	collection = collection.sort(function(a, b){
		if(a[mass] < b[mass]) return -1;
		if(a[mass] > b[mass]) return 1;
		return 0;
	});
	if(collection.length === 0) return new RangeSet(0,0);
	var median = getMedianMass(collection, 0, collection.length);
	var lqr = getMedianMass(collection, 0, Math.floor(collection.length * 0.5));
	var uqr = getMedianMass(collection, Math.ceil(collection.length * 0.5), collection.length);
	var lqrdb = getMedianMass(database, 0, Math.floor(database.length * 0.5));
	var uqrdb = getMedianMass(database, Math.ceil(database.length * 0.5), database.length);
	// var iqrParagraph = document.getElementById("iqr");
	// iqr.innerHTML = "Mass Interquartile Range for Subcollection: " + lqr + " -> " + uqr + "<br>Mass Interquartile Range for entire Database: " + lqrdb + " -> " + uqrdb;
	return new RangeSet(lqr, uqr);
}
//right is exclusive, left is inclusive
function getMedianMass(collection, left, right){
	if(typeof left === "undefined") left = 0;
	if(typeof right === "undefined") right = collection.length;
	var medianIndex = left + ((right - left) * 0.5);
	if(medianIndex === 0) return -1;
	if((right-left) % 2 === 0){
		//if is whole number, there are an even number of elements
		return ((collection[Math.max(medianIndex - 1, 0)][mass]) + (collection[Math.min(Math.max(medianIndex, 0), collection.length - 1)][mass])) * 0.5;
	} else {
		return collection[Math.floor(medianIndex)][mass];
	}
}
function getMaxMass(collection){
	var max = 0;
	for(var i = 0;i < collection.length;i++){
		max = Math.max(max, collection[i][mass]);
	}
	return max;
}
function getMinMass(collection){
	var min = 0;
	for(var i = 0;i < collection.length;i++){
		min = Math.min(min, collection[i][mass]);
	}
	return min;
}

function getLatitudeDistribution(steps){
	var stepMod = steps / 180;
	var distributions = [];
	for(var i= 0;i < steps;i++){
		//populate the array
		distributions.push([]);
	}
	for(var i = 0;i < database.length;i++){
		distributions[Math.floor(database[i][reclat] * stepMod + (steps / 2))].push(database[i]);
	}
	return distributions;
}
function getLatitudeValueDistribution(key, distributions){
	var values = [];
	for(var i = 0;i < distributions.length;i++){
		values.push(0);
		if(key === "count"){
			values[i] = distributions[i].length;
		} else if(key === "iqrRange"){
			// console.log(distributions[i].length);
			values[i] = getInterquartileRange(distributions[i]).getRange();
		}
	}
	// console.log(values);
	return values;
}

function drawLatitudeDistributionGraph(key, valueSet){
	var canvas = document.getElementById("latDistGraph");
	var gfx = canvas.getContext("2d");
	var gHeight = canvas.height;
	var gWidth = canvas.width;
	var stepSize = gHeight / valueSet.length;

	var alphaOne = -1;
	for(var i = 0;i < valueSet.length;i++){
		alphaOne = Math.max(alphaOne, valueSet[i]);
	}
	// var alphaOne = 179;
	gfx.fillStyle = '#FFFFFF';
	gfx.drawImage(flatWorldMap, 0, 0, gWidth, gHeight);
		for(var i = 0;i < valueSet.length;i++){
		gfx.fillStyle = "rgba(255, 0, 0, " + Math.pow((valueSet[i]/ alphaOne), 1/3) + ")";
		gfx.fillRect(0, gHeight - stepSize * (i + 1), gWidth, stepSize);
	}
}
function getOldestMeteorite(collection){
	var oldest = collection[0];
	for(var i = 0;i < collection.length;i++){
		if(oldest === null || collection[i][year] < oldest[year]){
			oldest = collection[i];
		}
	}
	return oldest;
}
function getNewestMeteorite(collection){
	var newest = collection[0];
	for(var i = 0;i < collection.length;i++){
		if(newest === null || collection[i][year] > newest[year]){
			newest = collection[i];
		}
	}
	return newest;
}
function sortCollectionByAge(collection){
	collection = collection.sort(function(a, b){
		if(a[year] < b[year]) return -1;
		if(a[year] > b[year]) return 1;
		return 0;
	});
	return collection;
}
//largest, most frequent, most affected, largest percentile mass
function processClick(event){

	var x = event.x;
	var y = event.y;
	var canvas = document.getElementById("US-Map");
	var rect = canvas.getBoundingClientRect();
	x -= rect.left;
	y -= rect.top
	y = rect.height - y;
	// console.log(x + ", " + y);
	var longInterval = rect.width / USAHorizonScale;
	var latInterval = rect.height / USAVerticalScale;
	var xCoord = Math.floor(x / longInterval);
	var yCoord = Math.floor(y / latInterval);
	// console.log(xCoord + ", " + yCoord);
	

	if(autoFeedPosition){
		console.log("AUTO FEEDING");
		xCoord = event.x;
		yCoord = event.y;
		autoFeedPosition = false;
	}


	var finalPos = xCoord + yCoord * USAHorizonScale;





	t_lastClickPosition = finalPos;
	console.log(xCoord + ", " + yCoord);
	if(tempMapGrid === null){
		return;
	}
	drawMap(tempMapGrid, finalPos);
	pauseChronoAnimation();
	location.href = "#";
	location.href = "#selectedAreaInfo";
	// console.log(finalPos);
	// console.log(tempMapGrid[finalPos]);
	updateTableValueDisplay();


	if(tempMapGrid[finalPos].length === 0){
		//No entries in region
		alert("No entries in the selected region");
		document.getElementById("selectedAreaInfo").style.display = "none";
		document.getElementById("massCategoryLineChart").style.display = "none";
		return;
	}

	var nextPredictedForArea =parseFloat(getNewestMeteorite(tempMapGrid[finalPos])[year].getFullYear()) + parseFloat((1 / getAverageMeteoritesPerYear(tempMapGrid[finalPos])).toFixed(0));

	update("SubsetLabel", getRegionLabel(xCoord, yCoord) + " (" + convertAreaLabelToReference(getRegionLabel(xCoord, yCoord)) + ")");
	update("SubsetNewest", getNewestMeteorite(tempMapGrid[finalPos])[name] + " (" + getNewestMeteorite(tempMapGrid[finalPos])[year].getFullYear() + ")");
	update("SubsetOldest", getOldestMeteorite(tempMapGrid[finalPos])[name] + " (" + getOldestMeteorite(tempMapGrid[finalPos])[year].getFullYear() + ")");
	update("SubsetIQR", getInterquartileRange(tempMapGrid[finalPos]).lower + "g to " + getInterquartileRange(tempMapGrid[finalPos]).upper + "g");
	update("SubsetAverageMass", getAverageMass(tempMapGrid[finalPos]).toFixed(3) + "g");
	update("USAverageMass", getAverageMass(getAmericanMeteorites()).toFixed(3) + "g");
	update("SubsetMassRangeExpectation", getMassGroupLabel(getMassRangeExpectation(categorizeByMass(tempMapGrid[finalPos]), tempMapGrid[finalPos].length)));
	update("USMassRangeExpectation", getMassGroupLabel(getMassRangeExpectation(categorizeByMass(getAmericanMeteorites()), getAmericanMeteorites().length)));
	update("SubsetStandardDeviation", getStandardDeviation(tempMapGrid[finalPos]).toFixed(3) + "g");
	update("USStandardDeviation", getStandardDeviation(getAmericanMeteorites()).toFixed(3) + "g");
	update("SubsetMeteoritesPerYear", getAverageMeteoritesPerYear(tempMapGrid[finalPos]).toFixed(3));
	update("USMeteoritesPerYear", getAverageMeteoritesPerYear(getAmericanMeteorites()).toFixed(3));
	update("SubsetAmpyPercentile", getPercentileAMPY(tempMapGrid, finalPos) + getOrdinalEnding(getPercentileAMPY(tempMapGrid, finalPos)));
	update("SubsetEntries", tempMapGrid[finalPos].length);
	update("USEntries", getAmericanMeteorites().length);
	update("SubsetPredictedTime", nextPredictedForArea);
	update("SubsetChanceNextYear", getChanceOfNextInXYears(tempMapGrid[finalPos], 1.0).toFixed(4));
	update("SubsetChanceNext5Years", getChanceOfNextInXYears(tempMapGrid[finalPos], 5.0).toFixed(4));
	update("SubsetDangerRank", findRankOfDangerousnessOfArea(finalPos) + getOrdinalEnding(findRankOfDangerousnessOfArea(finalPos)) + " out of " + (USAHorizonScale * USAVerticalScale));
	document.getElementById("selectedAreaInfo").style.display = "block";
	updateMassDistributionGraph(document.getElementById("distributionMode").value, tempMapGrid[finalPos]);

	createMultiLineMassChart(tempMapGrid[finalPos]);
	
	highlightDangerRankInListing(getRegionLabel(xCoord, yCoord));
	// console.log(finalPos + " FAIL: " + translateIndexToCoords(finalPos, USAHorizonScale, USAVerticalScale))

}
function exportData(){
	var text = "";
	text += getPair("SubsetLabel");
	text += getPair("SubsetNewest");
	text += getPair("SubsetOldest");
	text += getPair("SubsetIQR");
	text += getPair("SubsetAverageMass");
	text += getPair("USAverageMass");
	text += getPair("SubsetMassRangeExpectation");
	text += getPair("USMassRangeExpectation");
	text += getPair("SubsetStandardDeviation");
	text += getPair("USStandardDeviation");
	text += getPair("SubsetMeteoritesPerYear");
	text += getPair("USMeteoritesPerYear");
	text += getPair("SubsetAmpyPercentile");
	text += getPair("SubsetEntries");
	text += getPair("USEntries");
	text += getPair("SubsetPredictedTime");
	text += getPair("SubsetChanceNextYear");
	text += getPair("SubsetChanceNext5Years");
	text += getPair("SubsetDangerRank");
	text += "MapResolution: " + USAHorizonScale + "\r\n";
	text += "\r\nEntries:\r\n";

	for(var i = 0;i < tempMapGrid[t_lastClickPosition].length;i++){
		var temp = "";
		for(var j = 0;j < tempMapGrid[t_lastClickPosition][i].length;j++){
			temp += tempMapGrid[t_lastClickPosition][i][j] + (j === tempMapGrid[t_lastClickPosition][i].length ? "" : ", ");
		}
		text += temp + "\r\n";
	}
	var filename = prompt("Export to file: ", "")
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	saveAs(blob, filename + ".txt");
}
function update(div, value){
	document.getElementById(div).innerHTML = value;
}
function getPair(div){
	return div + ": " + document.getElementById(div).innerHTML + "\r\n";
}
function updateHeatmapParameters(){
	sqrtValuesOnMap = document.getElementById("sqrtCheckbox").checked;
	drawRanks = document.getElementById("drawDangerRanks").checked;
	USAHorizonScale = Math.floor(document.getElementById("heatmapPrecisionSlider").value);
	var displayMode = parseInt(document.getElementById("heatmapDisplayOptions").value);
	document.getElementById("hpro").innerHTML = USAHorizonScale;
	USAVerticalScale = Math.ceil(USAHorizonScale / 2);
	USAGridRadius = findDistance(0.0, 0.0, ((USAUpperLat - USALowerLat) / USAVerticalScale) * 0.5, ((USAUpperLong - USALowerLong) / USAHorizonScale) * 0.5);
	document.getElementById("gridRadius").innerHTML = USAGridRadius + " mi";

	var mapGrid = checkAmericanGrid();
	tempMapGrid = mapGrid;
	if(displayMode > -1){
		var massMapGrid = [];
		for(var i = 0;i < mapGrid.length;i++){
			var t = [];
			massMapGrid.push(t);
			for(var k = 0;k < mapGrid[i].length;k++){
				if(getMassGroup(mapGrid[i][k]) === displayMode){
					massMapGrid[i].push(mapGrid[i][k]);
				}
			}
		}
		mapGrid = massMapGrid;
	}
	drawMap(mapGrid, t_lastClickPosition);
	subCollection = getAmericanMeteorites();
	postDangerRankings();
	// getInterquartileRange(subCollection);
	
	// console.log(getLatitudeValueDistribution("count", latDist));
}
function updateLatDistGraph(){
	var sliderValue = Math.floor(document.getElementById("latDistSlider").value);
	var graphType = document.getElementById("latDistType").value;
	var latDist = getLatitudeDistribution(sliderValue);
	drawLatitudeDistributionGraph(graphType, getLatitudeValueDistribution(graphType, latDist));
}
function initListeners(){
	document.getElementById("US-Map").addEventListener("mousedown", processClick, false);
	console.log("init listeners");
}
function initPage(){
	LoadFile();
}
//0: <.5kg
//1: .5-1
//2: 1-5
//3: 5-10
//4: 10-50
//5: 50-100
//6: 100-500
//7: 500-1000
//8: >1000

function getMassGroupLabel(id){
	switch(id){
		case 0: return "< 0.5kg";
		case 1: return "0.5kg - 1kg";
		case 2: return "1kg - 5kg";
		case 3: return "5kg - 10kg";
		case 4: return "10kg - 50kg";
		case 5: return "50kg - 100kg";
		case 6: return "100kg - 500kg";
		case 7: return "500kg - 1000kg";
		case 8: return "> 1000kg";
		default: return "UNDEFINED GROUPING";
	}
}

function getMassGroup(entry){
	if(entry[mass] / 1000 < 0.5) return 0;
	if(entry[mass] / 1000 < 1) return 1;
	if(entry[mass] / 1000 < 5) return 2;
	if(entry[mass] / 1000 < 10) return 3;
	if(entry[mass] / 1000 < 50) return 4;
	if(entry[mass] / 1000 < 100) return 5;
	if(entry[mass] / 1000 < 500) return 6;
	if(entry[mass] / 1000 < 1000) return 7;
	if(entry[mass] / 1000 >= 1000) return 8;
	return -1; //if all else fails
}
function categorizeByMass(collection){
	var massGroupings = [];
	for(var i = 0;i < 9;i++){
		var newGroup = [];
		massGroupings.push(newGroup);
	}
	for(var i = 0;i < collection.length;i++){
		var groupID = getMassGroup(collection[i]);
		if(groupID < 0) console.log("ERROR: MASS NOT QUANTIFIABLE: " + collection[i]);
		massGroupings[groupID].push(collection[i]);
	}
	return massGroupings;
}
function getMassRangeExpectation(massGroupings, totalCount){
	var sum = 0;
	for(var i = 0;i < 9;i++){
		sum += i * (massGroupings[i].length / totalCount);
	}
	return Math.round(sum);
}
function testExpectations(collection){
	var massGroupings = categorizeByMass(collection);
	var expectation = getMassRangeExpectation(massGroupings, collection.length);
	console.log("MassGroup expectation: " + expectation);
	return massGroupings[expectation].length
}

function updateMassDistributionGraph(displayMode, subcollection){
	//Compile labels 
	if(displayMode === null)
		displayMode = document.getElementById("distributionMode").value;
	if(subcollection === null) 
		subcollection = tempMapGrid[t_lastClickPosition];
	displayMode = parseInt(displayMode);
	var labels = [];
	var data = [];
	//X axis labels
	for(var i = 0;i < 9;i++){
		labels.push(getMassGroupLabel(i));
		data.push(0);
	}
	
	for(var i = 0;i < subcollection.length;i++){
		var mg = getMassGroup(subcollection[i]);
		if(mg < 0) {
			//EVERYONE PANIC
			console.log("WHO LET THIS GUY IN HERE: " + subcollection[i]);
		}
		data[mg] = data[mg] + 1;
	}
	if(displayMode === 2){
		for(var i = 0;i < 9;i++){
			data[i] = data[i] / subcollection.length;
		}
	}
	if(massDistributionChartExists)
		massDistributionChart.destroy();
	var ctx = document.getElementById("massDistributionChart").getContext("2d");

	massDistributionChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
				label: 'Mass Grouping Distribution',
				backgroundColor: '#dd6f25',
				data: data,
			}]
		},
		scaleFontColor: '#dddddd',
		scaleColor: '#dddddd'
	})
	massDistributionChartExists = true;
}
function doChronoAnimation(){
	var collection = getAmericanMeteorites();
	collection = sortCollectionByDate(collection);
	chronoSubFunction(collection, Math.floor(document.getElementById("chronoPosSlider").value), true);
}
function pauseChronoAnimation(){
	if(workingAnimation !== null)
		clearTimeout(workingAnimation);
}
function chronoSubFunction(collection, maxIndex, continueLoop){
	var gridSections= [];
	var displayMode = parseInt(document.getElementById("heatmapDisplayOptions").value);
	if(getMassGroup(collection[maxIndex]) === displayMode || displayMode === -1){
		//grid sections are stored from bottom left to top right, row by row
		//like so, ([0,0],[0,1],[1,0],[1,1])
		//This loop initializes the 2d array
		for(var x = 0;x < USAHorizonScale * USAVerticalScale;x++){
			gridSections.push([]);
		}
		for(var i = 0;i < maxIndex;i++){
			console.log(getGridPosition(collection[i]));
			if(getMassGroup(collection[i]) === displayMode || displayMode === -1)
				gridSections[getGridPosition(collection[i])].push(collection[i]);
		}
		tempMapGrid = gridSections;
		drawMap(gridSections, getGridPosition(collection[maxIndex]));
		document.getElementById("chronoPosSlider").value = i;
		var cnvs = document.getElementById("US-Map");
		var t = cnvs.getContext("2d");
		t.font = "30px Arial";
		t.fillStyle = "black";
		t.textAlign = "center";
		t.fillText("" + collection[i][year].getFullYear(),cnvs.width / 2, cnvs.height / 2);
		t.font = "8px Arial";
		t.textAlign = "left";
		t.fillText("" + collection[i][year].toDateString(), .5, cnvs.height - 2.5);
		t.fillText("Entry #" + i, .5, cnvs.height - 10.5);
		var increment = 1;
		if(maxIndex + increment < collection.length && continueLoop){
			workingAnimation = setTimeout(function(){
					chronoSubFunction(collection, maxIndex + increment, true);
				}, chronoAnimationSpeed);
		}

	} else {
		if(maxIndex + 1 < collection.length && continueLoop){
			workingAnimation = setTimeout(function(){
					chronoSubFunction(collection, maxIndex + 1, true);
				}, 0);
		}
	}
}
function updateChronoSpeed(){
	chronoAnimationSpeed = Math.floor(document.getElementById("chronoSpeedSlider").value);
	document.getElementById("csPrec").innerHTML = "" + chronoAnimationSpeed;
}
function updateChronoPos(){
	var collection = getAmericanMeteorites();
	collection = sortCollectionByDate(collection);
	var pos = Math.floor(document.getElementById("chronoPosSlider").value);
	chronoSubFunction(collection, pos, false);
}
function getGridPosition(entry){
	//grid sections are stored from bottom left to top right, row by row
	//like so, ([0,0],[0,1],[1,0],[1,1])
	for(var y = 0;y < USAVerticalScale;y++){
		for(var x = 0;x < USAHorizonScale;x++){
			var latg1 = USALowerLat + (y + 0.5) * ((USAUpperLat - USALowerLat) / USAVerticalScale);
			var long1 = USALowerLong + (x + 0.5) * ((USAUpperLong - USALowerLong) / USAHorizonScale);
			if(findDistance(latg1, long1, entry[reclat], entry[reclong]) < USAGridRadius){
				return x + y * USAHorizonScale;
			}
			//gridSections.push(subCollection);
			
		}
	 }
	 return -1;
}
function drawMap(mapGrid, positionHighlighted){
	var mapCanvas = drawGeoMap();
	var ctx = mapCanvas.getContext("2d");
	var highest = 0;
	for(var i = 0;i < mapGrid.length;i++){
		if(mapGrid[i].length > highest) highest = mapGrid[i].length;
	}
	var latInterval = mapCanvas.height / USAVerticalScale;
	var longInterval = mapCanvas.width / USAHorizonScale;
	for(var i = 0;i < mapGrid.length;i++){
		var r_a;
		if(sqrtValuesOnMap)
			r_a = Math.min(Math.sqrt(mapGrid[i].length / highest) , 1); 
		else
			r_a = Math.min(mapGrid[i].length / highest, 1);
		ctx.fillStyle = "rgba(255, 0, 0, " + r_a + ")";
		ctx.fillRect( (i % USAHorizonScale) * longInterval,mapCanvas.height - Math.floor(i / USAHorizonScale) * latInterval - latInterval, longInterval, latInterval);
		if(positionHighlighted === i){
			ctx.fillStyle = "rgba(0, 0, 255, 255)";
			ctx.strokeRect((i % USAHorizonScale) * longInterval,mapCanvas.height - Math.floor(i / USAHorizonScale) * latInterval - latInterval, longInterval, latInterval)
		}
		if(drawRanks){
			ctx.font = "9px Arial";
			ctx.fillStyle = "black";
			ctx.textAlign = "center";
			var rank = findRankOfDangerousnessOfArea(i); 
			ctx.fillText("" + rank +  getOrdinalEnding(rank),  (i % USAHorizonScale) * longInterval + longInterval / 2,mapCanvas.height - Math.floor(i / USAHorizonScale) * latInterval - latInterval + latInterval / 2);
		}
	}

	return ctx;
}
function drawGeoMap(){
	var mapCanvas = document.getElementById("US-Map");
	var ctx = mapCanvas.getContext("2d");
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
	ctx.drawImage(map, 0, 0, mapCanvas.width, mapCanvas.height);
	return mapCanvas;
}
function getStandardDeviation(collection){
	if(collection.length === 1) return 0;
	var avgMass = getAverageMass(collection);
	var total = 0;
	for(var i = 0;i < collection.length;i++){
		total += Math.pow(collection[i][mass] - avgMass, 2);
	}
	total = total / (collection.length - 1);
	return Math.sqrt(total);
}
// function getExtremeValues(collection){
// 	var stdev = getStandardDeviation(collection);
// 	var medMass = getMedianMass(collection, 0, collection.length);
// 	var count = 0;
// 	var extremeValues = [];
// 	for(var i = 0;i < collection.length;i++){
// 		if(collection[i][mass] > medMass + stdev || collection[i][mass] < medMass - stdev){
// 			extremeValues.push(collection[i]);
// 		}
// 	}
// 	return extremeValues;
// }
// function filterExtremeValues(collection){
// 	var stdev = getStandardDeviation(collection);
// 	var medMass = getMedianMass(collection, 0, collection.length);
// 	var count = 0;
// 	var standardValues = [];
// 	for(var i = 0;i < collection.length;i++){
// 		if(collection[i][mass] < medMass + stdev && collection[i][mass] > medMass - stdev){
// 			standardValues.push(collection[i]);
// 		}
// 	}
// 	return standardValues;
// }
function updateTableValueDisplay(){
	var tableMode = parseInt(document.getElementById("tableValueDisplayMod").value);
	switch(tableMode){
		case 0: 
		tableCreate(tempMapGrid[t_lastClickPosition], "USTable");
		break;
		case 1: 
		tableCreate(filterCollection(tempMapGrid[t_lastClickPosition], filterForStandardValues), "USTable");
		break;
		case 2:
		tableCreate(filterCollection(tempMapGrid[t_lastClickPosition], filterForExtremeValues), "USTable");
		break;
	}
}
function getAverageMeteoritesPerYear(collection){
	//get count of meteorites for each year starting with the earliest known american report
	var oldestYear = getOldestMeteorite(getAmericanMeteorites())[year].getFullYear();
	var currentYear = 2017;
	var countArray = [];
	for(var i = 0; i < currentYear - oldestYear;i++){
		countArray.push(0);
	}
	for(var j = 0;j < collection.length;j++){
		countArray[collection[j][year].getFullYear() - oldestYear]++;
	}
	var average = 0;
	for(var k = 0;k < countArray.length;k++){
		average += countArray[k] / countArray.length;
	}
	return average;
}
function getPercentileAMPY(mapGrid, id){
	var ampyArray = [];
	for(var i = 0;i < mapGrid.length;i++){
		ampyArray.push(getAverageMeteoritesPerYear(mapGrid[i]));
	}
	ampyArray = ampyArray.sort(function(a, b){
		if(a < b) return -1;
		if(a > b) return 1;
		return 0;
	});
	return getPercentile(ampyArray, getAverageMeteoritesPerYear(mapGrid[id]));
}
function getPercentile(sortedArray, value){
	var highestIndex;
	for(var i = sortedArray.length -1;i >= 0;i--){
		if(sortedArray[i] === value){
			highestIndex = i;
			break;
		}
		highestIndex = -1;
	}
	return Math.round(highestIndex / sortedArray.length * 100, 0);
}
function createMultiLineMassChart(collection){
	document.getElementById("massCategoryLineChart").style.display = "block";
	if(massGroupLineChart != null){
		massGroupLineChart.destroy();
	}

	var cumulative = document.getElementById("lineChartCumulative").checked;

	var lineChartData = {}; //declare an object
	lineChartData.labels = []; //add 'labels' element to object (X axis)
	lineChartData.datasets = []; //add 'datasets' array element to object

	var massGroupings = categorizeByMass(collection);
	// var rangeStart = getOldestMeteorite(collection)[year].getFullYear();
	var rangeStart = 1900;
	var range = getNewestMeteorite(collection)[year].getFullYear() - rangeStart;

	for(var year1 = rangeStart;year1 <= range + rangeStart;year1++){
		lineChartData.labels.push(year1);
	}
	for(var i = 0; i < 9;i++){

		

		lineChartData.datasets.push({}); //creates a new data object
		var dataset = lineChartData.datasets[i];
		dataset.backgroundColor = "RGBA(0,0,0,0)";
		dataset.borderColor =  !document.getElementById("lineChartCheckbox" + i).checked ? "RGBA(1,1,1,0)" : getIndexColor(i);
		console.log(dataset.strokeColor);
		document.getElementById("lcc" + i).style.color = getIndexColor(i);
		dataset.data = [];

		for(var year1 = rangeStart;year1 <= range + rangeStart;year1++){
			if(cumulative)
				dataset.data.push(dataset.data.length === 0 ? 0 : dataset.data[year1-rangeStart - 1]);
			else
				dataset.data.push(0);
			for(var j = 0; j< massGroupings[i].length;j++){
				if(massGroupings[i][j][year].getFullYear() === year1)
					dataset.data[year1-rangeStart]++;
			}
		}
	}


	var ctx = document.getElementById("massGroupLineChart").getContext("2d");
	//massGroupLineChart = new Chart(ctx).Line(lineChartData);
	massGroupLineChart = new Chart(ctx, {
		type: 'line',
		data: lineChartData
	});
	return lineChartData;
}
function refreshMassGroupLineChart(){
	createMultiLineMassChart(tempMapGrid[t_lastClickPosition]);
}
function getChanceOfNextInXYears(collection, years){
	//Uses exponential distribution
	var lambda = getAverageMeteoritesPerYear(collection);
	var prob = 1.0 - Math.pow(Math.E, (-lambda * years));
	return prob;
}
function rankAreaByDanger(){

	if(USAHorizonScale === lastRankResolution) return lastRankings;

	var dataPairs = [];
	for(var i = 0;i < tempMapGrid.length;i++){
		var value = [];
		var coords = translateIndexToCoords(i, USAHorizonScale, USAVerticalScale);
		var label = getRegionLabel(coords[0], coords[1]);
		value.push(label);
		value.push(getChanceOfNextInXYears(tempMapGrid[i], 1));
		dataPairs.push(value);
	}
	//highest first
	dataPairs.sort(function(a, b){
		if(a[1] < b[1]) return 1;
		if(a[1] > b[1]) return -1;
		return 0;
	});
	//set cached copy
	lastRankings = dataPairs;
	lastRankResolution = USAHorizonScale;

	return dataPairs;
}
function findRankOfDangerousnessOfArea(index){
	var coords = translateIndexToCoords(index, USAHorizonScale, USAVerticalScale);
	var label = getRegionLabel(coords[0], coords[1]);
	var rankings = rankAreaByDanger();
	for(var i = 0;i < rankings.length;i++){
		if(label === rankings[i][0]) return i + 1; // offset by 1 so there is no 0th place
	}
	return -1;
}
function postDangerRankings(){
	var container = document.getElementById("rankingsList");
	var rankings = rankAreaByDanger();
	var text = "";
	for(var i = 0;i < rankings.length;i++){
		text += (i + 1) + ": <a id=\"rankPosting" + (i+1) + "\" href=\"#\">" + rankings[i][0] + "</a> (" + rankings[i][1].toFixed(5) + ")<br>";
	}
	container.innerHTML = text;

	for(var i = 0;i < rankings.length;i++){
		
		$('#rankPosting' + (i + 1)).click(function(){
			var label = this.innerHTML;
			var coords = translateRegionLabelToCoords(label);
			var event = {x:coords.x, y: coords.y};
			autoFeedPosition = true;
			
			processClick(event);
		});
	}
}
function highlightDangerRankInListing(label){
	var rankings = rankAreaByDanger();
	for(var i = 0;i < rankings.length;i++){
		var element = document.getElementById("rankPosting" + (i+1));
		element.style.backgroundColor = (element.innerHTML === label) ? "#FF0000" : "transparent";
	}
}

function rankAreasByAverageMassUsing(func){
	var mapGridCopy = [];
	for(var i = 0;i < tempMapGrid.length;i++){
		mapGridCopy.push(tempMapGrid[i]);
		var coords = translateIndexToCoords(i, USAHorizonScale, USAVerticalScale);
		var label = getRegionLabel(coords[0], coords[1]);
		mapGridCopy[i].areaLabel = label;
	}
	mapGridCopy = mapGridCopy.sort(function(a, b){
		if((func(a) > func(b)) || isNaN(func(a))) return -1;
		if((func(a) < func(b)) || isNaN(func(b))) return 1;
		return 0;
	});
	for(var i = 0;i < mapGridCopy.length;i++){
		var val = func(mapGridCopy[i]);
		console.log("Region:" + mapGridCopy[i].areaLabel + " | " + val + " | E:" + val.entries + " | " + val.min + " - " + val.max);
	}

}
function getAverageMassUsingInterquartileValues(collection){
	var range = getInterquartileRange(collection);
	if(collection.length === 0) return 0;
	var average = 0;
	var count = 0;
	for(var c = 0;c < collection.length;c++){
			if(collection[c][mass] > range.upper || collection[c][mass] < range.lower) continue;
			average += collection[c][mass];
			count++;
		}
	var ans = new Number(average / count);
	ans.entries = count;
	ans.max = range.upper;
	ans.min = range.lower;
	return ans;
}
function getAverageMassUsingSTDFilter(collection){
	var normalValues = filterCollection(collection, filterForStandardValues)
	var ans = getAverageMass(normalValues);
	var stdev = getStandardDeviation(normalValues);
	var medMass = getMedianMass(normalValues, 0, normalValues.length);
	ans.min = medMass - stdev;
	ans.max = medMass + stdev;
	return ans;
}
//rankAreasByAverageMassUsing(getAverageMass);
//rankAreasByAverageMassUsing(getAverageMassUsingInterquartileValues);
//rankAreasByAverageMassUsing(getAverageMassUsingSTDFilter);

function collapseFilterList(){
	var list = document.getElementById("filterList");
	if (list.style.display === "none") {
        list.style.display = "block";
    } else {
        list.style.display = "none";
    }
}