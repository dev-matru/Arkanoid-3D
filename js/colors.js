function shuffle(array) {
    var currentIndex = array.length,  randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function convert(slice){
    return parseInt(Number("0x" + slice)) / 255;
}

var colors = [];

colorCodes.forEach(c => {
    colors.push([convert(c.slice(0,2)), convert(c.slice(2,4)), convert(c.slice(4,6))]);
});

shuffle(colors);