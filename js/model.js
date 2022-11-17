var ball, paddle, walls, blocks;

function buildArena(){

    //BALL
    ball = { 
        x: arena.width/2, 
        y: 0.2,
        radius: radius,
        angle: randomBallAngle(), //direction vector angle in radians
        speed: difficulty[game.mode],
        numOfPoints: 8,
        points: []
    };

    for(let angle=0; angle< 2*Math.PI; angle+=2*Math.PI/ball.numOfPoints){

        let xCoord = ball.radius * Math.cos(angle);
        if (Math.abs(xCoord) < 1E-15) xCoord = 0;
        
        let yCoord = ball.radius * Math.sin(angle);
        if (Math.abs(yCoord) < 1E-15) yCoord = 0;
        
        ball.points.push({x: xCoord , y: yCoord});
    }

    //PADDLE
    paddle = {   
        id: 'paddle',
        x: arena.width/2,
        y: -0.25,
        width: 2.5,
        height: 0.25
    }; 

    //WALLS
    walls = {   
        //LEFT WALL
        left:
        {   
            id: 'left',
            x: 0.0,
            y: arena.height/2,
            width: arena.wallSize,
            height: arena.height
        },

        //RIGHT WALL
        right:
        {   
            id: 'right',
            x: arena.width,
            y: arena.height/2,
            width: arena.wallSize,
            height: arena.height
        },
        
        //TOP WALL
        top:
        {   
            id: 'top',
            x: arena.width/2,
            y: arena.height,
            width: arena.width,
            height: arena.wallSize
        },
        
        /*  //BOTTOM WALL
        bottom:
        {   
            //id: 'bottom',
            x: arena.width/2,
            y: 0.0,
            width: arena.width,
            height: 0.0,
        } */
    };

    w = arena.width - arena.wallSize;
    h = arena.height - arena.wallSize/2;
    lastRowLimit = h * arena.lastRowLimitRatio;
    columnStep = w / arena.numOfColumns;
    rowStep = (h - lastRowLimit) / arena.numOfRows;
    xOffset = columnStep/2 + arena.blocksSpacing * arena.numOfColumns/2;
    id = 0;

    blocks = [];

    for (let i = xOffset; i <= w; i+=columnStep){
        for (let j = h - rowStep/2; j >= lastRowLimit ; j-=rowStep){
            blocks.push({
                id: id,
                color: colors[id % arena.numOfRows],
                x: i,
                y: j,
                width: columnStep - arena.blocksSpacing,
                height: rowStep - arena.blocksSpacing,
                broken: false
            });
            id++;
        }
    }
    game.maxScore = blocks.length;
}