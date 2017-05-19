
var inited = false;
var fallTypeChart;
var materialTypeChart;
var matVsMassChart;
var commonColors = ["#000000","#ff0000","#ffd700","#ff7373","#b0e0e6","#ffa500","#660066","#990000","#00ff00"];


var fallTypes = [];
function FallType(name){
    this.name = name;
    this.count = 1;
};

var materialTypes = [];
function MaterialType(name){
    this.name = name;
    this.count = 1;
};

function MatVsMassEntry(name){
    this.name = name;
    this.avgMass = 0;
};

//sort by fall type
function observeFallTypes(collection){
    fallTypes = [];
    var found =false;
    for(var c = 0;c < collection.length;c++){
        found = false;
        for(var i = 0;i < fallTypes.length;i++){
            if(fallTypes[i].name === collection[c][fall]){
                fallTypes[i].count++;
                found = true;
            }
        }
        if(!found)
            fallTypes.push(new FallType(collection[c][fall]));
    }
}
function buildFallDoughnut(){
    var data = [];
    for(var i = 0;i < fallTypes.length;i++){
        data.push({
            value: fallTypes[i].count,
            color: commonColors[i % commonColors.length]
        });
    }
    var canvas = document.getElementById("fallChart");
    var ctx = canvas.getContext("2d");
    fallTypeChart = new Chart(ctx).Doughnut(data);
    return data;
}
function buildMaterialDoughnut(){
    var data = [];
    for(var i = 0;i < materialTypes.length;i++){
        data.push({
            value: materialTypes[i].count,
            color: commonColors[i % commonColors.length]
        });
    }
    var materialCanvas = document.getElementById("materialChart");
    var ctx = materialCanvas.getContext("2d");
    materialTypeChart = new Chart(ctx).Doughnut(data);
    return data;
}
//sort by material type
function observeMaterialTypes(collection){
    materialTypes = [];
    var found =false;
    for(var c = 0;c < collection.length;c++){
        found = false;
        for(var i = 0;i < materialTypes.length;i++){
            if(materialTypes[i].name === collection[c][recclass]){
                materialTypes[i].count++;
                found = true;
            }
        }
        if(!found)
            materialTypes.push(new MaterialType(collection[c][recclass]));
    }
    return materialTypes;
}
function observeMatVsMass(collection) {
    
    var matVsMass = [];
    for(var i = 0;i < materialTypes.length;i++){
        matVsMass.push(new MatVsMassEntry(materialTypes[i].name));
    }
    for(var c = 0;c < collection.length;c++){
        for(var i = 0;i < matVsMass.length;i++){
            if(matVsMass[i].name === collection[c][recclass]){
                matVsMass[i].avgMass += parseInt(collection[c][mass]);
            }
        }
        
    }
    // console.log(matVsMass);
    for(var i = 0;i < materialTypes.length;i++){
        for(var j = 0;j < matVsMass.length;j++){
            if(matVsMass[i].name === materialTypes[j].name){
                matVsMass[i].avgMass /= materialTypes[j].count; 
            }
        }
    }

    var materialLabels = [];
    var materialData = [];
    for(var i = 0;i < matVsMass.length;i++){
        materialLabels.push(matVsMass[i].name);
        materialData.push(matVsMass[i].avgMass);
    }
    

    // console.log(materialLabels);
    // console.log(materialData);

    var ctx = document.getElementById("matvsmass").getContext("2d");
    matVsMassChart = new Chart(ctx).Bar({
            labels: materialLabels,
            datasets: [{
                label: 'Material Type vs Average Mass',
                fillColor: '#556633',
                data: materialData
            }]
        });
    return matVsMass;
}


function buildDoughnuts(){
    if(inited){
        fallTypeChart.destroy();
        materialTypeChart.destroy();
        matVsMassChart.destroy();
    } else {
        inited =true;
    }
    
    observeMaterialTypes(subCollection);
    buildMaterialDoughnut();
    observeFallTypes(subCollection);
    buildFallDoughnut();

    observeMatVsMass(subCollection);
}