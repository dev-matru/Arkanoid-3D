var game = {
    status: 'start',
    mode: 'easy',
    score: 0.0,
    maxScore: 0.0,
}

var difficulty = {
    easy: 0.1,
    medium: 0.15,
    hard: 0.2
};

var arena = { 
    width: 10.0, 
    height: 10.0,
    wallSize: 0.25,
    numOfRows: 5,
    numOfColumns: 8,
    blocksSpacing: 0.05,
    lastRowLimitRatio: 3/5
};

var light = {
    type: 'point',
    lightColor: [1.0, 1.0, 1.0],
    lightPosition: [0.0, 8.0, -8],
    LTarget: 8.0,	    //g parameter
    LDecay:  0.8  	  	//β parameter
};
  
var camera = {
    cx: 0.0,
    cy: 10.0,
    cz: 5.0, 
    elevation: -45.0,
    angle: 0.0
};
  
var perspective = {
    aspect: null,
    zNear: 0.1,
    zFar: 100,
    fieldOfViewDeg: 60
}; 

var specularColor = [1.0, 1.0, 1.0];
var specularShine = 100.0; 

var colorCodes = ['461E52', 'DD517F', 'E68E36', '556DC8', '7998EE', 'A653F5', '8F8CF2', '65B8BF', 'F96CFF', 'FA92FB', '05ffa1'];