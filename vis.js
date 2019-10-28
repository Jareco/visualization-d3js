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
        var currentColor;
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
            })
            .on("mouseover", function (d, i) {
                currentColor = d3.select(this).style("fill");
                svg.selectAll("text, rect").attr("class", "unfocused");
                svg.selectAll(".map-color").style("fill", "lightgray");
                d3.select(this).style("fill", "orange");
                d3.select(this).attr("class", "focused");
                svg.append("text")
                    .datum(d)
                    .attr("x",
                        function (d) {
                            return -barsWidth;
                        })
                    .attr("y",
                        function (d) {
                            return -barScale(d.numberOfClaims) - 2;
                        }).text(function (d) {
                        return d.numberOfClaims + '';
                    }).attr("transform", function (d) {
                        return "translate(" + projection([d.longitude, d.latitude]) + ")"; // this is based on https://gis.stackexchange.com/questions/34769/how-can-i-render-latitude-longitude-coordinates-on-a-map-with-d3
                    }).attr("id", function(d){
                        return d.airportCode;
                    }).attr("fill", "black");
                svg.select("#" + d.airportCode).attr("class", "focused");
                svg.select("#" + d.airportCode + "-name").attr("class", "focused");
            })
            .on("mouseout", function (d, i) {
                d3.select(this).style("fill", currentColor);
                d3.select("#" + d.airportCode).remove();
                svg.selectAll("text, rect").attr("class", "focused");
                svg.selectAll(".map-color").style("fill", null);
            }).on("click", function(d,i){
                d3.select("body").select(".column-table").insert("h1", ".table-frame").text("Loading...");
                d3.select("body").select(".column-table").select(".table-frame").select("table").select("tbody").selectAll("tr").remove();
                let claims = data.filter(row => row['Airport Code'] === d.airportCode);

                claims.forEach(function(claimElement, claimIndex){
                    d3.select("table").select("tbody").append("tr").attr("id", "claim-" + claimIndex);
                    let claimRow = d3.select("table").select("tbody").select("#claim-" + claimIndex);
                    claimRow.append("td").text(claimIndex);
                    claimRow.append("td").text(claimElement['Airline Name']);
                    claimRow.append("td").text(claimElement['Airport Code']);
                    claimRow.append("td").text(claimElement['Airport Name']);
                    claimRow.append("td").text(claimElement['Claim Type']);
                    claimRow.append("td").text(claimElement['Claim Site']);
                    claimRow.append("td").text(claimElement['Month']);
                    claimRow.append("td").text(claimElement['Day']);
                    claimRow.append("td").text(claimElement['Status']);
                    claimRow.append("td").text(claimElement['Claim Amount']);
                    claimRow.append("td").text(claimElement['Item']);
                    claimRow.append("td").text(claimElement['coordinates']);
                });

                d3.select("body").select(".column-table").select("h1").remove();

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
            }).attr("id", function(d){
                return d.airportCode + "-name";
            });


    })
    .catch(function (error) {
        console.log(error);
    });