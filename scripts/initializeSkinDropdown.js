define([
    'skins'
],

function(skins) 
{
  var arr = [];
  for(var i in skins){
    arr.push(skins[i]);
  }
  
  
  for(var i = 0; i < arr.length; i++){
    var dropdown = document.getElementById("skin-dropdown");
    var opt = document.createElement("option"); 
    opt.text = arr[i].name;
    opt.value = arr[i].name;
    dropdown.options.add(opt);
  }

  function defaultSkin(){
    return arr[0].pallete;
  }
  

	return function()
	{
		return defaultSkin();
	}
});