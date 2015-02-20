require([
    'data/programs',
    'data/programYears',
    'data/cohorts',
    'data/courses',
    'data/competencies',
    'domready'
], 
function(programs, programYears, cohorts, courses, competencies, domReady) 
{
	var draw = function()
	{

		var width = 860,
	    height = 700,
	    radius = Math.min(width, height) / 2;

		var x = d3.scale.linear()
		    .range([0, 2 * Math.PI]);

		var y = d3.scale.sqrt()
		    .range([0, radius]);

		var color = d3.scale.category20c();

		var svg = d3.select("body").append("svg")
		    .attr("width", width)
		    .attr("height", height)
		  .append("g")
		    .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

		var partition = d3.layout.partition()
		    .sort(null)
		    .value(function(d) { return 1; });


		var arc = d3.svg.arc()
		    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
		    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
		    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
		    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });





		// Hardcoding paths
		// Probably best way to do this is to bfs to find all child nodes	
		var current_layer = [];


		for(var p in programs){
			var individual_p = programs[p]; // ["PH","M"]
			var program_year_ids = individual_p.programYears; // ['58','69'] contains indicies
			var py_branch = [];

			// use individual indicies to get program years
			for (var i = 0; i < program_year_ids.length; i++) {
				p_id = program_year_ids[i];
				py_branch.push(programYears[p_id]);
			};
			current_layer.push({title: individual_p.title, children: py_branch});
		};


		// for(var p in programs){
		// 	var individual_p = programs[p]; // ["PH","M"]
		// 	var program_year_ids = individual_p.programYears; // ['58','69'] contains indicies
		// 	var py_branch = [];

		// 	// use individual indicies to get program years
		// 	for (var i = 0; i < program_year_ids.length; i++) {
		// 		p_id = program_year_ids[i];

		// 		// use p_index to get that program year's array of competency indicies
		// 		competency_ids = programYears[p_id].competencies;
		// 		var c_titles = [];

		// 		// use competency_ids to get individual competency titles
		// 		for (var i = 0; i < competency_ids.length; i++) {
		// 			c_id = competency_ids[i];
		// 			c_titles.push(competencies[c_id].title);
		// 		};
		// 		py_branch.push({title: programYears[p_id].id, children: c_titles});
		// 	};
		// 	current_layer.push({title: individual_p.title, children: py_branch});
		// };



		var pathObj = {title: "Root", children: current_layer}; // the full path


		var node; // keeps track of node that is currently being displayed as the root

		var root = pathObj;
		
		node = root;

		// original
		// draw the sections of the sunburst using the path
		// var path = svg.datum(root).selectAll("path")
		//   	.data(partition.nodes).enter()
		//  	.append("path")
		//     .attr("id", function(d, i) { return "path-" + i; })
	    // .attr("d", arc)
		//  .style("fill", function(d) { return color((d.children ? d : d.parent).title); })
		//  .on("click", click)
		//  .each(stash);

		var g = svg.selectAll("g")
		      .data(partition.nodes(root))
		    .enter().append("g");

	

		  // new
		  var path = g.append("path")
		    .attr("d", arc)
		    .style("fill", function(d) { return color((d.children ? d : d.parent).title); })
		    .on("click", click);


		  var text = g.append("text")
		    .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
		    .attr("x", function(d) { return y(d.y); })
		    .attr("dx", "6") // margin
		    .attr("dy", ".35em") // vertical-align
		    .text(function(d) { return d.title; });

		    function click(d) 
		    	{
			    // fade out all text elements
			    text.transition().attr("opacity", 0);

			    path.transition()
			      .duration(750)
			      .attrTween("d", arcTween(d))
			      .each("end", function(e, i) {
	         	 // check if the animated element's data e lies within the visible angle span given in d
	         	if (e.x >= d.x && e.x < (d.x + d.dx)) {
	            // get a selection of the associated text element
	            var arcText = d3.select(this.parentNode).select("text");
	            // fade in the text element and recalculate positions
	            arcText.transition().duration(750)
	              .attr("opacity", 1)
	              .attr("transform", function() { return "rotate(" + computeTextRotation(e) + ")" })
	              .attr("x", function(d) { return y(d.y); });
          }
      });
  }
		

		d3.select(self.frameElement).style("height", height + "px");


		// Interpolate the scales!
		function arcTween(d) {
		  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
		      yd = d3.interpolate(y.domain(), [d.y, 1]),
		      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
		  return function(d, i) {
		    return i
		        ? function(t) { return arc(d); }
		        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
		  };
		}

		function computeTextRotation(d) {
		  return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
		}
	};


  domReady(function () 
  {

    console.log('ready');
    draw();
  });

});
