var name = 0; //String
var id = 1; //number
var nameType = 2; //String
var recclass = 3; //String
var mass = 4; //Number
var fall = 5; //String
var year = 6; //Date
var reclat = 7; //Number
var reclong = 8; //Number
var geolocation = 9; //String

var USALowerLat = 25; //Southern boundary of US
var USAUpperLat = 50; //Northen boundary of US 
var USALowerLong = -125; // Western boundary of US
var USAUpperLong = -65; // Eastern boundary of US

var Rm = 3961; // mean radius of the earth (miles) at 39 degrees from the equator

var flatWorldMap = new Image(); //Image for the world graphics
    flatWorldMap.src = "flatMap.gif";

var map = new Image(); // Image for the US graphics
    map.src = "US-Map-Small.png";

var tableHeaders = "<th>Name</th><th>ID</th><th>Nametype</th><th>RecClass</th><th>Mass (g)</th><th>Fall</th><th>Year</th><th>RecLat</th><th>RecLong</th><th>GeoLocation</th>";

var brickVolume = 1064.532; // mililiters
var brickMass = 2041.17; // grams