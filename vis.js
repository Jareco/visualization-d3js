//Variable definitions
var barsHeight = 50;
var barsWidth = 20;

var width = 960;
var height = 960;
var projection = d3.geoAlbersUsa();

var path = d3.geoPath()
    .projection(projection);
var graticule = d3.geoGraticule()
    .extent([
        [-98 - 80, 38 - 45],
        [-98 + 35, 38 + 45]
    ])
    .step([5, 5]);

var svg = d3.select("#s1").attr("width", width)
    .attr("height", height);;


svg.selectAll("path")
    .data(graticule.lines())
    .enter().append("path")
    .attr("class", "graticule")
    .attr("d", path);

// US map is taken from here : http://bl.ocks.org/poezn/bb2d4a3ec5dadaf743d5?fbclid=IwAR29tHRgtOc2WsDWY-9GwB-fBqxtQK59h3J_sbpyusw2BcU2bz6kuyJCXVs
d3.json("us.json").then((mapData) => {

    svg.insert("path", ".graticule")
        .datum(topojson.feature(mapData, mapData.objects.states))
        .attr("class", "map-color")
        .attr("d", path)

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(mapData, mapData.objects.states, function (el1, el2) {
            return el1 !== el2;
        }))
        .attr("class", "state")
        .attr("d", path);
});



d3.csv("tsa_claims.csv")
    .then(function (data) {

        // Claim per Airport
        var numberOfClaimsPerAirport = {};
        data.forEach(function (d) {
            if (numberOfClaimsPerAirport[d['Airport Code']]) {
                numberOfClaimsPerAirport[d['Airport Code']] = numberOfClaimsPerAirport[d['Airport Code']] + 1;
            } else {
                numberOfClaimsPerAirport[d['Airport Code']] = 1;
            }
        });



        var airportData = [];
        var dataMax = 0;
        //Find data maximum (the biggest total number of claims) and save in the array
        Object.keys(numberOfClaimsPerAirport).forEach(function (key) {
            if (numberOfClaimsPerAirport[key] > dataMax) {
                dataMax = numberOfClaimsPerAirport[key];
            }
            var tempObject = {};
            tempObject.airportCode = key;
            tempObject.numberOfClaims = numberOfClaimsPerAirport[key];
            var airportJson = data.find((element) => {
                return element['Airport Code'] == key;
            });
            var coordinates = airportJson['coordinates'].split(',');
            tempObject.longitude = coordinates[0];
            tempObject.latitude = coordinates[1];
            tempObject.airportName = airportJson['Airport Name'];
            airportData.push(tempObject);
        });

        // Create scale to map price to bar length.
        var barScale = d3.scaleLinear()
            .domain([0, dataMax])
            .range([0, barsHeight]);

        //Add bars to the map
        svg.selectAll("rect")
            .data(airportData)
            .enter()
            .append("svg:rect")
            .attr("x",
                function (d) {
                    return -barsWidth;
                })
            .attr("y",
                function (d) {
                    return -barScale(d.numberOfClaims);
                })
            .attr("width", barsWidth)
            .attr("height",
                function (d) {
                    return barScale(d.numberOfClaims);
                })
            .style("fill",
                function (d, i) {
                    var arrayOfColors = ["lightblue", "white", "red", "gray", "blue", "black"];
                    var arrayIndex = i % arrayOfColors.length;
                    return arrayOfColors[arrayIndex];
                })
            .attr("transform", function (d) {
                return "translate(" + projection([d.longitude, d.latitude]) + ")";
            });

        svg.selectAll("text")
            .data(airportData)
            .enter()
            .append("text")
            .attr("x",
                function (d) {
                    return -barsWidth;
                })
            .attr("y",
                function (d) {
                    return barsWidth;
                }).text(function (d) {
                return d.airportCode;
            }).attr("transform", function (d) {
                return "translate(" + projection([d.longitude, d.latitude]) + ")"; // this is based on https://gis.stackexchange.com/questions/34769/how-can-i-render-latitude-longitude-coordinates-on-a-map-with-d3
            });


    })
    .catch(function (error) {
        console.log(error);
    });