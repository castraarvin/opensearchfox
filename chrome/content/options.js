var prefs = Components.classes["@mozilla.org/preferences-service;1"].
              getService(Components.interfaces.nsIPrefService).
                getBranch("extensions.opensearchfox.option.");

function load(){
  document.getElementById('option1').checked = prefs.getBoolPref('option1');
}

function save(){
  prefs.setBoolPref("option1", document.getElementById('option1').checked);
}

