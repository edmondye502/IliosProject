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

		var y = d3.scale.pow().exponent(1.3).domain([0,1]).range([0,radius]);

		var color = d3.scale.category20c();

		var svg = d3.select("body").append("svg")
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

	};


  domReady(function () 
  {

    console.log('ready');
    draw();
  });

});
