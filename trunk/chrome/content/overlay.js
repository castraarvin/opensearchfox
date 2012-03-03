function notExist(obj){
  if(typeof(obj) == 'undefined' || obj == "" || obj == null)
    return true;
  return false;
}

function needToShowOrNot(e){
  var target=gContextMenu.target;
  var opensearchfox_menu=document.getElementById('opensearchfox-menu');

  if(notExist(target.form) || notExist(target.form.action) || target.disabled || notExist(target.name)){
    opensearchfox_menu.hidden=true;
    return;
  }
  switch(target.type.toLowerCase()){
    case 'file':
    case 'submit':
    case 'reset':
    case 'image':
    case 'button': 
      opensearchfox_menu.hidden=true;
      break;
    default :
      opensearchfox_menu.hidden=false;
  }
}

function SEW_Listener(e){
  var contentAreaContextMenu = document.getElementById('contentAreaContextMenu');
  contentAreaContextMenu.addEventListener("popupshowing", needToShowOrNot, false);
}

function startWizard(user){
  window.openDialog("chrome://opensearchfox/content/searchEngineWizard2.xul",
            "Wizard",
              "chrome,resizable,dependent,dialog,minimizable=0,alwaysRaised",
                user, user.form);
}