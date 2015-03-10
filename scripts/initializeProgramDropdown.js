define([
    'data/programs'
],

function(programs) 
{
  function allProgramTitles(){
    var p_titles = [];
    for(var i in programs){
      p_titles.push(programs[i].shortTitle);
    }
    return p_titles;
  }

  var all_titles = allProgramTitles(); 

  
  for(var i = 0; i < all_titles.length; i++){
    var dropdown = document.getElementById("program-dropdown");
    var opt = document.createElement("option"); 
    opt.text = all_titles[i];
    opt.value = all_titles[i];
  
    dropdown.options.add(opt);
  }

  function defaultProgramName(){
    return all_titles[0];
  }
  

	return {defaultProgramName: defaultProgramName,
          program_titles: all_titles};
	
});