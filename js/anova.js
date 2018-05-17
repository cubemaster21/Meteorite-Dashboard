//anova.js

//get mean for each area
//computer overall mean
	//sum all individual values, divide by number of total entries

function getGrandMean(matrix){
	var total = 0;
	var nT = 0;
	for(var i = 0;i < matrix.length;i++){
		for(var j = 0;j < matrix[i].length;j++){
			total += matrix[i][j][mass];
			nT++;
		}
	}
	return total / nT;
}

function getNTotal(matrix){
	var total = 0;
	for(var j = 0;j < matrix.length;j++){
		total += matrix[j].length;
	}
	return total;
}


//compute ssto
//nT - 1 DOF
function getSSTO(matrix){
	var yBarBar = getGrandMean(matrix);

	var ssto = 0;
	for(var j = 0;j < matrix.length;j++){
		for(var i = 0;i < matrix[j].length;i++){
			var v = Math.pow(matrix[j][i][mass] - yBarBar, 2);
			ssto += v;
		}
	}
	return ssto;
}
//Compute SSTR
//matrix.length - 1 DOF
function getSSTR(matrix){
	var yBarBar = getGrandMean(matrix);

	var sstr = 0;
	for(var j = 0;j < matrix.length;j++){
		var v = Math.pow(getAverageMass(matrix[j]) - yBarBar, 2);
		sstr += v * matrix[j].length;
	}
	return sstr;
}

//nT - matrix.Length DOF
function getSSE(matrix){

	var sse = 0;
	for(var j = 0;j < matrix.length;j++){
		var jMass = getAverageMass(matrix[j]);
		for(var i = 0;i < matrix[j].length;i++){
			var v = Math.pow(matrix[j][i][mass] - jMass, 2);
			sse += v;
		}
	}
	return sse;
}



function fTestForEquality(matrix){
	var alpha = .05;
	var trDOF = matrix.length - 1;
	var errDOF = getNTotal(matrix) - matrix.length;
	var MSTR = getSSTR(matrix) / trDOF;
	var MSE = getSSE(matrix) / errDOF;
	var fValue = MSTR / MSE;
	var fLookup = fdistr(trDOF, errDOF, alpha);
	console.log("Alpha: " + alpha);
	console.log("Treatment DOF: " + trDOF);
	console.log("Error DOF: " + errDOF);
	console.log("MSTR: " + MSTR);
	console.log("MSE: " + MSE);
	console.log("F*: " + fValue);
	console.log("F from Table: " + fLookup);
}