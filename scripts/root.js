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
      function inside(x, arr){
      if(arr){
      for (var i = 0; i < arr.length; i++) {
        if(x == arr[i]){
          return true;
        }
      };
    }
      return false; 
    }
    
    function cohortToProgramTitle(cid){
      var py = programYears[cid.programYear];
      return programs[py.program].title;
    }

    function cohortToProgramId(cid){
      //cohorts[c].programYear;
      var py = programYears[cohorts[cid].programYear];
      return py.program;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // given cohort_id, returns competency ids
    //cohort -> programYear -> competencies
    function cohortToCompetencyIDs(cid){
    var coh = cohorts[cid];
    var py = programYears[coh.programYear];
    return py.competencies;
    }

    // given a competency_id, return an array of courses associated
    function competencyIDToCourses(competency_id, cohort_courses){
    var all_associated_courses = [];

    var competency_objLVL_ids = competencies[competency_id].objectives;
          //console.log("competency_ids", competency_objLVL_ids);
    for(var i = 0; i < competency_objLVL_ids.length; i++){
      var course_level_ids = competencyLevel_ObjectiveID_To_CourseLevelIDs(competency_objLVL_ids[i]);
      //console.log("course_level_ids", course_level_ids);
      for(var j = 0; j < course_level_ids.length; j++){
        var courses_per_obj = CourseLevelObjectiveIDs_To_Courses(course_level_ids[j], cohort_courses);
        all_associated_courses = all_associated_courses.concat(courses_per_obj);
      }
    }

    return all_associated_courses;
    }

    //given a competency level objective id, get children id's
    function competencyLevel_ObjectiveID_To_CourseLevelIDs(objective_id){
    return objectives[objective_id].children;
    }

    //given course level objective id get arr courses (objects)
    function CourseLevelObjectiveIDs_To_Courses(objective_id, cohort_courses){
    var course_obj_arr = []
    var course_ids = objectives[objective_id].courses; 
    for (var i = 0; i < course_ids.length; i++) {
      if(inside(course_ids[i], cohort_courses)){
        var c = courses[course_ids[i]];
        course_obj_arr.push({title: c.title, size: 1});
      }
    }
    return course_obj_arr;
    }
  
  

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


// 3-layer (single)programs -> cohorts -> programs -> competencies
    function buildRoot(){
      var p_titles = allProgramTitles(); 
      p_titles = p_titles[0]; // Pharm/MD
        var pid = programTitleToAssociatedID(p_titles);
        var c_ids = programChildren(pid);
        var cohort_layer = [];
        for (var i = 0; i < c_ids.length; i++) {
          var competency_ids = cohortToCompetencyIDs(c_ids[i]); // needs to give back course ids?
          var competency_layer = [];
          var cohort_courses = cohorts[c_ids[i]].courses;
          for (var j = 0; j < competency_ids.length; j++) {
            var course_layer = competencyIDToCourses(competency_ids[j], cohort_courses);
            competency_layer.push({title: competencies[competency_ids[j]].title,  children: course_layer});
          };
          cohort_layer.push({title: cohorts[c_ids[i]].title, children: competency_layer});
        };
      
    var root = {title: p_titles,  children: cohort_layer};
    console.log(root);
    return root;
    };



	return function()
	{
		return buildRoot();
	}
});