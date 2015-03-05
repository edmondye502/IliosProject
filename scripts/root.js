// root.js

define([
    'data/programs',
    'data/programYears',
    'data/cohorts',
    'data/courses',
    'data/competencies',
    'data/objectives',
],

function(programs, programYears, cohorts, courses, competencies, objectives) 
{

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



	return function()
	{
		return buildRoot();
	}
});