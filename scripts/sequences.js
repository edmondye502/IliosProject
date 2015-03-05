require([
    'data/programs',
    'data/programYears',
    'data/cohorts',
    'data/courses',
    'data/competencies',
    'data/objectives',
    'domready'
], 

function(programs, programYears, cohorts, courses, competencies, objectives, domReady) 
{
  var draw = function()
  {
    // Dimensions of sunburst.
    var width = 750;
    var height = 600;
    var radius = Math.min(width, height) / 2;

    // Mapping of step titles to colors.
    // var colors = {
    //   "programs": "#5687d1",
    //   "cohorts": "#7b615c",
    //   "courses": "#de783b",
    //   "objectives": "#6ab975"
    // };

    var colors = ["#5687d1", "#7b615c", "#de783b", "#6ab975"];

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
        .value(function(d) { return 1000 });

    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
     
    var oldStructure = {}; 	
    	
    	
    
    var json = buildRoot(); 
    //console.log(json);
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
          .style("fill", function(d) { return randomColor(); })
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
    	if(oldStructure){
    	zoomOut()
    	}
     }
     
     
    function zoomIn(d)
    {
    	oldStructure = d.parent; 
      // sections represents all 16 sections, 
      var sections = d3.select("#container").selectAll("path")

      sections.remove();
      
      
      var nodes = partition.nodes(d);

      var path = vis.data([d]).selectAll("path")
          .data(nodes)
          .enter().append("svg:path")
          .attr("display", function(d) { return d.depth ? null : "none"; })
          .attr("d", arc)
          .attr("fill-rule", "evenodd")
          .style("fill", function(d) { return randomColor(); })
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
          .style("fill", function(d) { return randomColor(); })
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

      // change text in middle circle to reflect title of node
      d3.select("#percentage")
          .text(d.title);

      d3.select("#explanation")
          .style("visibility", "");

      var sequenceArray = getAncestors(d);
      updateBreadcrumbs(sequenceArray);

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


    // Breadcrumb default dimensions: width, height, spacing, width of tip/tail, 
        //multiplier to increase width of breadcrumb based on length of d.title (m >= 7)
    var b = {
      w: 75, h: 30, s: 5, t: 10, m: 8
    };

    // Holds the width of all the nodes in the current path
    var bWidths = [];

    // Minimum width of a breadcrumb is defined by b.w; 
      //addWidth will increase the length of a breadcrumb width based on d.title
    var addWidth = 0;

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
      }

    // Generate a string that describes the points of a breadcrumb polygon.
    function breadcrumbPoints(d, i) {
      var points = [];
     
      calculateWidths(d);

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

    function calculateWidths(d) {

      addWidth = 0;
      if(d.title.length * b.m > b.w)
      {
        // extra width to add to the breadcrumb's default width in order to fit node text
        addWidth = (d.title.length * b.m) - b.w;
      }

      bWidths.push(b.w + addWidth);
    }

    // Update the breadcrumb trail to show the current sequence
    function updateBreadcrumbs(nodeArray) {

      // // Reset widths of the current trail if at root node
      if (bWidths.length >= nodeArray.length)
      {
        // recaluclate new bWidths
        bWidths = [];
        for(var i = 0; i < nodeArray.length; i++)
        {
          calculateWidths(nodeArray[i]);
        }
      }

      // Data join
      var g = d3.select("#trail")
          .selectAll("g")
          .data(nodeArray, function(d) { return d.title; });

      // Add breadcrumb and label for entering nodes.
      var entering = g.enter().append("svg:g");

      entering.append("svg:polygon")
          .attr("points", breadcrumbPoints)
          .style("fill", function(d) { return randomColor(); })
          .style("stroke", "black");

      entering.append("svg:text")
          .attr("x", function(d, i) { return ((bWidths[i] + b.t) / 2)})
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


    function randomColor(){
      return colors[Math.floor((Math.random() * colors.length) )];
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


    function cohortToProgramTitle(cid){
      var py = programYears[cid.programYear];
      return programs[py.program].title;
    }

    function cohortToProgramId(cid){
      //cohorts[c].programYear;
      var py = programYears[cohorts[cid].programYear];
      return py.program;
    }

    function cohortToCompetencies(cid){
      var coh = cohorts[cid];
      var py = programYears[coh.programYear];
      var competency_ids = py.competencies;
      var competency_arr = [];
      for (var i = 0; i < competency_ids.length; i++) {
        competency_arr.push(competencies[competency_ids[i]]); 
      }
      return competency_arr;
    }

    // given cohortid, returns courses
    function cohortToCourses(cid){
      return cohorts[cid].courses; 
    }

    // course -> [competency_obj]
    function courseToCompetencies(cid){
      var competency_arr = [];
      var oids = courses[cid].objectives;
      for (var i = 0; i < oids.length; i++){
              var c = objectivesToCompetency(oids[i]);
              if(c){
                  competency_arr.push(c);
              }
      }
      return competency_arr;
    } 

      function courseToObjectives(cid){
          var objectives_arr = [];
          var oids = courses[cid].objectives;
          for (var i = 0; i < oids.length; i++){
              objectives_arr.push(objectives[oids[i]]);
          }
          return objectives_arr;

      }


    function objectivesToCompetency(oid){
      var competency_id = objectives[oid].competency;
      return competencies[competency_id];
    }



    function allProgramTitles(){
      var p_titles = [];
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
      var c_ids = [];
      for(var i in cohorts){
        c_ids.push(cohorts[i].id);
      }
      return c_ids;

    }

    
      // returns cohort_ids
  function programChildren(pid){
      var c_ids = allCohortsIDs();
      var matching_cohorts = [];
      for (var i = 0; i < c_ids.length; i++){
      if(pid == cohortToProgramId(c_ids[i])){
        matching_cohorts.push(c_ids[i]);      
      }   
    } 

    return matching_cohorts;
  }

    function buildRoot(){
      var rootChildren = [];
      var p_titles = allProgramTitles(); // Pharm/MD
      for (var i = 0; i < p_titles.length; i++){
        var pid = programTitleToAssociatedID(p_titles[i]);
        var c_ids = programChildren(pid);
        var cohort_layer = []
        for (var j = 0; j < c_ids.length; j++) {
          var course_ids = cohortToCourses(c_ids[j]); // needs to give back course ids?
          var course_layer = [];
          for (var k = 0; k < course_ids.length; k++) {
                      var objective_layer = courseToObjectives(course_ids[k]);
            course_layer.push({title: courses[course_ids[k]].title, children: objective_layer});
          };
        cohort_layer.push({title: cohorts[c_ids[j]].title, children: course_layer});
        };

        rootChildren.push({title: p_titles[i], children: cohort_layer}); // program -> cid  
      }
      var root = {title: "Ilios Curriculum", children: rootChildren};
      return root;
    };

  };

    domReady(function () 
  {
    console.log('ready');
    draw();
  });

});
