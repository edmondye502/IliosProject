// Dimensions of sunburst.
var width = 750;
var height = 600;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 75, h: 30, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = {
  "home": "#5687d1",
  "product": "#7b615c",
  "search": "#de783b",
  "account": "#6ab975",
  "other": "#a173d1",
  "end": "#bbbbbb"
};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0; 

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return d.size; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
 
var oldStructure = {}; 	
	
	
// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.


  var json = {
 "name": "Ilios Circumlum Visualizer",
 "children": [
	{"name":"Medicine",
	 "children":[
		{
		  "name":"Year One",
		  "children":[
		  {"name":"Biochemistry","size": 4000},
		  {"name":"Clinical Skills 1","size": 4000},
		  {"name":"Cell Biology ADV","size": 2000},
		  {"name":"Holistic Health","size": 2100}
		  ]

		},
		{
		  "name":"Year Two",
		  "children":[
		  {"name":"Family Medicine","size": 3100},
		  {"name":"Cancer Fundamentals","size": 1900},
		  {"name":"Emergency Medicine","size": 6000}
		  ]

		}]},
	{"name":"Pharmacy",
	 "children":[
		{
		  "name":"Year Three",
		  "children":[
		  {"name":"Public Health","size": 3909},
		  {"name":"Electronic Health","size": 4600}
		  ]

		},
		{
		  "name":"Year Four",
		  "children":[
		  {"name":"FamilyMedicine","size": 3990},
		  {"name":"Intership","size": 4000}
		  ]

		}]}
 ]
}
  createVisualization(json);


// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

  // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend();
  d3.select("#togglelegend").on("click", toggleLegend);
  oldStructure = json; 

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0)
	  .on("click", clickCenter)
	  
	  
  // start with text in middle
  d3.select("#percentage")
      .text("Ilios Visualizer")
	  
	  

  // For efficiency, filter nodes to keep only those large enough to see.
  // MAY NEED TO CHANGE **************
  var nodes = partition.nodes(json);

  var path = vis.data([json]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { return colors[d.name]; })
      .style("opacity", 1)
      .on("mouseover", mouseover)
      .on("click", click);



	
  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave) ;

  // Get total size of the tree = value of root node from partition.
  totalSize = path.node().__data__.value;
 };

 function click(d){
	if(arcHasChildren(d)){
		zoomIn(d);
	}
 }
 
 function clickCenter(){
	console.log("insdide center", oldStructure)
	console.log("json", json);
	if(oldStructure){
	zoomOut()
	}
 }
 
 
function zoomIn(d)
{
	oldStructure = d.parent; 
	console.log("zoomIn old structure now:", oldStructure);
  // sections represents all 16 sections, 
  var sections = d3.select("#container").selectAll("path")
  console.log(sections);

  sections.remove();
  
  console.log("what i clicked on:", d)
  
  var nodes = partition.nodes(d);

  var path = vis.data([d]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { return colors[d.name]; })
      .style("opacity", 1)
      .on("mouseover", mouseover)
      .on("click", click)
      .each(stash) 
      .transition()
      .duration(750)
      .attrTween("d", arcTween);
  // Get total size of the tree = value of root node from partition.
  totalSize = path.node().__data__.value;
}

function zoomOut(){
  // sections represents all 16 sections, 

  var sections = d3.select("#container").selectAll("path")

  sections.remove();
  
  d = oldStructure; // ONLY DIFFERENCE
  var nodes = partition.nodes(d);
  
  
  var path = vis.data([d]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { return colors[d.name]; })
      .style("opacity", 1)
      .on("mouseover", mouseover)
      .on("click", click)
      .each(stash) 
      .transition()
      .duration(750)
      .attrTween("d", arcTween);
  // Set next zoom out structure to the parent node		
  oldStructure = oldStructure.parent
	
  // Get total size of the tree = value of root node from partition.
  totalSize = path.node().__data__.value;	
}



function arcHasChildren(d){
	if(d.children){
	return true;
	}
	return false; 
}

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }

  // change text in middle circle to reflect name of node
  d3.select("#percentage")
      .text(d.name);

  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = getAncestors(d);
  updateBreadcrumbs(sequenceArray, percentageString);

  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .transition()
      .duration(1000)
      .style("visibility", "hidden");
	  
  // return to basic text in middle when mouse leaves
  d3.select("#percentage")
      .text("Ilios Visualizer")
	  .style("visibility","visible");
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.name + d.depth; });

  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return colors[d.name]; });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; });

  // Set position for entering and updating nodes.
  g.attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 75, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) { return d.value; });

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}


 function arcTween(a){
                    var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
                    return function(t) {
                        var b = i(t);
                        a.x0 = b.x;
                        a.dx0 = b.dx;
                        return arc(b);
                    };
                };
        
function stash(d) {
                    d.x0 = 0; // d.x;
                    d.dx0 = 0; //d.dx;
                }; 