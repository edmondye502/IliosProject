require([
    'data/programs',
    'data/programYears',
    'data/cohorts',
    'data/courses',
    'domready'
], 
function(programs, programYears, cohorts, courses,  domReady) 
{
	var draw = function()
	{

		var width = 960,
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



		var pathObj = {title: "Root", children: current_layer}; // the full path


		var node; // keeps track of node that is currently being displayed as the root

		var root = pathObj;
		
		node = root;

		// draw the sections of the sunburst using the path
		var path = svg.datum(root).selectAll("path")
		  	.data(partition.nodes).enter()
		 	.append("path")
		    .attr("id", function(d, i) { return "path-" + i; })

		    .attr("d", arc)
		    .style("fill", function(d) { return color((d.children ? d : d.parent).title); })
		    .on("click", click)
		    .each(stash);

		// Used to switch between "size" and "count" buttons
		//d3.selectAll("input").on("change", function change() {
		//  var value = this.value === "count"
		//      ? function() { return 1; }
		//      : function(d) { return d.size; };
		//
		//  path
		//      .data(partition.value(value).nodes)
		//      .transition()
		//      .duration(1000)
		//      .attrTween("d", arcTweenData);
		//});
		  
		// var text = vis.selectAll("text").data(nodes);
		// var textEnter = text.enter().append("text")
		//     .style("fill-opacity", 1)
		//     .style("fill", function(d) {
		//       return brightness(d3.rgb(colour(d))) < 125 ? "#eee" : "#000";
		//     })
		//     .attr("text-anchor", function(d) {
		//       return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
		//     })
		//     .attr("dy", ".2em")
		//     .attr("transform", function(d) {
		//       var multiline = (d.name || "").split(" ").length > 1,
		//           angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
		//           rotate = angle + (multiline ? -.5 : 0);
		//       return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
		//     })
		//     .on("click", click);
		// textEnter.append("tspan")
		//     .attr("x", 0)
		//     .text(function(d) { return d.depth ? d.name.split(" ")[0] : ""; });
		// textEnter.append("tspan")
		//     .attr("x", 0)
		//     .attr("dy", "1em")
		//     .text(function(d) { return d.depth ? d.name.split(" ")[1] || "" : ""; });

		  function click(d) {
		    node = d;
		    console.log(current_layer);
		    console.log(d.title);
		    path.transition()
		      .duration(1000)
		      .attrTween("d", arcTweenZoom(d));
		      // text.style("visibility", function(e) {
		      //     return isParentOf(d, e) ? null : d3.select(this).style("visibility");
		      //   })
		      // .transition()
		      //   .duration(duration)
		      //   .attrTween("text-anchor", function(d) {
		      //     return function() {
		      //       return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
		      //     };
		      //   })
		      //   .attrTween("transform", function(d) {
		      //     var multiline = (d.name || "").split(" ").length > 1;
		      //     return function() {
		      //       var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
		      //           rotate = angle + (multiline ? -.5 : 0);
		      //       return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
		      //     };
		      //   })
		      //   .style("fill-opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
		      //   .each("end", function(e) {
		      //     d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
		      //   });
		  }
		

		d3.select(self.frameElement).style("height", height + "px");

		// Setup for switching data: stash the old values for transition.
		function stash(d) {
		  d.x0 = d.x;
		  d.dx0 = d.dx;
		}

		// When switching data: interpolate the arcs in data space.
		function arcTweenData(a, i) {
		  var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
		  function tween(t) {
		    var b = oi(t);
		    a.x0 = b.x;
		    a.dx0 = b.dx;
		    return arc(b);
		  }
		  if (i == 0) {
		   // If we are on the first arc, adjust the x domain to match the root node
		   // at the current zoom level. (We only need to do this once.)
		    var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
		    return function(t) {
		      x.domain(xd(t));
		      return tween(t);
		    };
		  } else {
		    return tween;
		  }
		}

		// When zooming: interpolate the scales.
		function arcTweenZoom(d) {
		  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
		      yd = d3.interpolate(y.domain(), [d.y, 1]),
		      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
		  return function(d, i) {
		    return i
		        ? function(t) { return arc(d); }
		        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
		  };
		}
	};


  domReady(function () 
  {

    console.log('ready');
    draw();
  });

});
