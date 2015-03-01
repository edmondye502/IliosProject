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
		    .range([0, 2*Math.PI]);

		var y = d3.scale.linear()
		    .range([0, radius]);

		var color = d3.scale.category20c();


		var svg = d3.select("body")
			.append("svg")
		    	.attr("width", width+100)
		    	.attr("height", height+100)
		    .append("g")
		    	.attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

		var partition = d3.layout.partition()
		    .sort(null)
		    .value(function(d) { return 1; });

		// console.log(cohortToProgramTitle(cohorts[41]));
		// console.log(cohortToCourses(cohorts[41]));
		// console.log(cohortToCompetencies(41));
		// console.log(allProgramTitles());
		// console.log(allCohortsIDs());
		//console.log(programTitleToAssociatedID("MD"));
		// console.log(cohortToProgramId(57));
		// console.log(programChildren(1));
		// console.log(buildRoot());

		var current_layer = buildRoot();
		var root = {title: "hi", children: current_layer}; // the full path

		var g = svg.selectAll("g")
		    .data(partition.nodes(root))
		    .enter().append("g");

		var arc = d3.svg.arc()
		    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
		    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
		    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
		    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
		  
		  var path = g.append("path")
		    .attr("d", arc)
		    .style("fill", function(d) { return color((d.children ? d : d.parent).title); })
		    .on("click", click)
		    .style("stroke", "black");

		 var text = g.append("text")
	        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")rotate(" + computeTextRotation(d) + ")"; })
	        .attr('text-anchor', function (d) { return computeTextRotation(d) < 180 ? "end" : "start"; })
	        //.attr("dx", "6") // margin
	        .attr("dy", ".35em") // vertical-align
	        .style("font-size", "8px")
	        .text(function(d) { return d.title; });
		

	    function click(d) 
	    	{
	    		//console.log(g);
		    // fade out all text elements
		    text.transition().attr("opacity", 0);

		    path.transition()
		      .duration(750)
		      .attrTween("d", arcTween(d))
		      .each("end", function(e, i) {
		         	 // check if the animated element's data e lies within the visible angle span given in d
		         	if (e.x >= d.x && e.x < (d.x + d.dx)) 
		         	{
		            // get a selection of the associated text element
		            var arcText = d3.select(this.parentNode).select("text");
		            // fade in the text element and recalculate positions
		            arcText.transition().duration(750)
		              .attr("opacity", 1)
		              
		              .attr("transform", function() { return "rotate(" + computeTextRotation(e) + ")" })
		              .attr("x", function(d) { return y(d.y); });

		            // UPDATE BREADCRUMBS!!!
		            updateBreadcrumbs(getAncestors(d));

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
		        var ang = (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
		        return (ang > 90) ?  180 + ang : ang;
    	}

    	function cohortToProgramTitle(cid){
    		py = programYears[cid.programYear];
    		return programs[py.program].title;
    	}

    	function cohortToProgramId(cid){
    		//cohorts[c].programYear;
    		py = programYears[cohorts[cid].programYear];
    		return py.program;
    	}

    	// chagne to title
    	function cohortToCourses(cid){
    		course_ids = cid.courses; //arr
    		course_names = [];
    		for (i = 0; i < course_ids.length; i++){
    			course_names.push(courses[course_ids[i]].title);
    		}
    		return course_names;
    	}

    	function cohortToCompetencies(cid){
    		coh = cohorts[cid];
    		py = programYears[coh.programYear];
    		competency_ids = py.competencies;
    		competency_titles = [];
    		for (var i = 0; i < competency_ids.length; i++) {
    			competency_titles.push(competencies[competency_ids[i]]); 
    		}
    		return competency_titles;
    	}

    	function allProgramTitles(){
    		p_titles = [];
    		for(var i in programs){
    			p_titles.push(programs[i].shortTitle);
    		}
    		return p_titles;
    	}

    	function programTitleToAssociatedID(p_title){
    		for(var i in programs){
    			if(programs[i].shortTitle == p_title){
    				return programs[i].id; 
    			}
    		}
    	}

    	function allCohortsIDs(){
    		c_ids = [];
    		for(var i in cohorts){
    			c_ids.push(cohorts[i].id);
    		}
    		return c_ids;

    	}

    	
		function programChildren(pid){
    		c_ids = allCohortsIDs();
    		matching_cohorts = [];
    		for (var i = 0; i < c_ids.length; i++){
				if(pid== cohortToProgramId(c_ids[i])){
					matching_cohorts.push(c_ids[i]);			
				}		
			}	
			return matching_cohorts;
		}

    	function buildRoot(){
    		var root = [];
    		p_titles = allProgramTitles(); // Pharm/MD
    		for (var i = 0; i < p_titles.length; i++){
    			var pid = programTitleToAssociatedID(p_titles[i]);
    			c_ids = programChildren(pid);
    			cohort_layer = []
    			for (var j = 0; j < c_ids.length; j++) {
    				cohort_layer.push({title: cohorts[c_ids[j]].title, children: cohortToCompetencies(c_ids[j])});
    			};




    			root.push({title: p_titles[i], children: cohort_layer}); // program -> cid  
    		}
    		return root;
    	}

    	initializeBreadcrumbTrail();

    	// Breadcrumb default dimensions: width, height, spacing, width of tip/tail.
		var b = {
		  w: 75, h: 30, s: 5, t: 10
		};

		var bWidths = [];

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
		}

		var addWidth = 0;

    	// Generate a string that describes the points of a breadcrumb polygon.
		function breadcrumbPoints(d, i) {
		  var points = [];
		 
		  addWidth = 0;
		  if(d.title.length * 10 > b.w)
		  {
		  	// extra width to add to the breadcrumb's default width in order to fit node text
		  	addWidth = (d.title.length * 15) - b.w;
		  }
		  
		  bWidths.push(b.w + addWidth);

		  points.push("0,0");
		  points.push((b.w + addWidth) + ",0");
		  points.push((b.w + addWidth) + b.t + "," + (b.h / 2));
		  points.push((b.w + addWidth) + "," + b.h);
		  points.push("0," + b.h);
		  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
		    points.push(b.t + "," + (b.h / 2));
		  }

		  return points.join(" ");
		}

		// Update the breadcrumb trail to show the current sequence.
		function updateBreadcrumbs(nodeArray) {

		  // Reset widths of the current trail if at root node
		  if (nodeArray.length == 0)
		  {
		  	  bWidths = [];
		  }
			
		  // Data join
		  var g = d3.select("#trail")
		      .selectAll("g")
		      .data(nodeArray, function(d) { return d.title; });

		  // Add breadcrumb and label for entering nodes.
		  var entering = g.enter().append("svg:g");

		  entering.append("svg:polygon")
		      .attr("points", breadcrumbPoints)
		      .style("fill", function(d) { return color((d.children ? d : d.parent).title); });

		  entering.append("svg:text")
		      .attr("x", function(d, i) { return ((bWidths[i] + b.t) / 2) })
		      .attr("y", b.h / 2)
		      .attr("dy", "0.35em")
		      .attr("text-anchor", "middle")
		      .text(function(d) { return d.title; });

		  // Set position for entering and updating nodes.
		  g.attr("transform", function(d, i) {
		  	var newWidthPos = 0;
	  		for (var x = 0; x < i; x++)
	  		{
	  			newWidthPos = newWidthPos + bWidths[x] + b.s;
	  
	  		}
		  	
		    return "translate(" + newWidthPos + ", 0)";
		  });

		  // Remove exiting nodes.
		  g.exit().remove();

		}
	};


  domReady(function () 
  {

    console.log('ready');
    draw();
  });

});
