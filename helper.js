function deg2rad(deg) {
	rad = deg * Math.PI/180; // radians = degrees * pi/180
	return rad;
}
// round to the nearest 1/1000
function round(x) {
	return Math.round( x * 1000) / 1000;
}
function findDistance(latitude, longitude, latitude2, longitude2) {
	var latr1, lonr1, latr2, lonr2, dlat, dlon, a, c, dm, mi;

	// convert coordinates to radians
	latr1 = deg2rad(latitude);
	lonr1 = deg2rad(longitude);
	latr2 = deg2rad(latitude2);
	lonr2 = deg2rad(longitude2);
	
	// find the differences between the coordinates
	dlat = latr2 - latr1;
	dlon = lonr2 - lonr1;
	
	// here's the heavy lifting
	a  = Math.pow(Math.sin(dlat/2),2) + Math.cos(latr1) * Math.cos(latr2) * Math.pow(Math.sin(dlon/2),2);
	c  = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); // great circle distance in radians
	dm = c * Rm; // great circle distance in miles
	// round the results down to the nearest 1/1000
	mi = round(dm);
	
	// display the result
   return mi;
}
function tableCreate(sc, targetID) {
	//body reference 
	// var body = document.getElementsByTagName("body")[0];
	var body = document.getElementById(targetID);

	// create elements <table> and a <tbody>
	var tbl     = document.createElement("table");

	tbl.className="tablesorter";
	tbl.id = "datatable"
	var tblBody = document.createElement("tbody");
	var header = tbl.createTHead();
	header.insertRow(0).innerHTML = tableHeaders;
	// cells creation
	for (var j = 0; j < sc.length; j++) {
		// table row creation
		var row = document.createElement("tr");
		for (var i = 0; i < 10; i++) {
			// create element <td> and text node 
			//Make text node the contents of <td> element
			// put <td> at end of the table row
			var cell = document.createElement("td");    
			var cellText = document.createTextNode(sc[j][i]); 

			cell.appendChild(cellText);
			row.appendChild(cell);
		}

		//row added to end of table body
		tblBody.appendChild(row);
	}

	// append the <tbody> inside the <table>
	tbl.appendChild(tblBody);
	//clear the body first;
	body.innerHTML = "";

	// put <table> in the <body>
	body.appendChild(tbl);
	// tbl border attribute to 
	tbl.setAttribute("border", "2");
	$(function(){
		$('#datatable').tablesorter();
	});
}
// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ){
	var exemptedEntries = 0;
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			strMatchedDelimiter !== strDelimiter
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}

		var strMatchedValue;

		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			strMatchedValue = arrMatches[ 3 ];
		}
		if(strMatchedValue === "") {
			exemptedEntries++;
			//continue;
		}

		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}
	// Return the parsed data.
	return( arrData );
}
function getOrdinalEnding(num){
	var special = Math.abs(num) % 100;
	if(special == 11 || special == 12 || special == 13) return "th";

	switch(Math.abs(num) % 10){
		case 1: 
		return "st";
		case 2: 
		return "nd";
		case 3:
		return "rd";
		default: 
		return "th";
	}
	return "FAIL";
}
function getIndexColor(index){
	switch(index){
		case 0: return "rgba(255, 0, 0, 255)";
		case 1: return "rgba(255, 0, 255, 255)";
		case 2: return "rgba(0, 255, 0, 255)";
		case 3: return "rgba(0, 0, 255, 255)";
		case 4: return "rgba(0, 255, 255, 255)";
		case 5: return "rgba(100, 150, 0, 255)";
		case 6: return "rgba(255, 125, 255, 255)";
		case 7: return "rgba(100, 0, 0, 255)";
		case 8: return "rgba(0, 75, 125, 255)";
	}
}
function translateIndexToCoords(index, width, height){
	var x = index % width;
	var y = Math.floor(index / width);
	return [x, y];
}
function translateRegionLabelToCoords(label){
	var x = 0;
	var y = 0;
	var charCount = 0;
	for(var i = label.length - 1; i > -1;i--){
		for(var j = 0;j < chars.length;j++){

			if(label.charAt(i) === chars[j]){
				x += j + (charCount * 26)
				charCount++;
				break;
			}
		}
	}
	var number = label.substring(charCount);
	y = Math.floor(number);
	console.log("y: " + y)
	return {x: x,y: y};
}
function getRegionLabel(x, y){
	
	var name = "";
	// Uses Excel column naming convention
	var dividend = x + 1;
	var modulo = 0;
	while(dividend > 0){
		modulo = (dividend - 1) % 26;
		name = chars[modulo] + name;
		dividend = Math.floor((dividend - modulo) / 26); 
	}


	name += y;
	return name;
}