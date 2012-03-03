const user = window.arguments[0];
const theForm = window.arguments[1];
const Cc = Components.classes;
const Ci = Components.interfaces;
const INPUTENCODING = theForm.ownerDocument.characterSet;
const METHOD = theForm.method ? theForm.method : "get";
var SEARCHURL = theForm.action.indexOf("?") != -1 ?
                  theForm.action.substr(0, theForm.action.indexOf("?")) : theForm.action;
var prefs = Cc["@mozilla.org/preferences-service;1"].
              getService(Ci.nsIPrefService).
                getBranch("extensions.opensearchfox.option.");
var msgs = document.getElementById('msgs');
var successful_controls = [];

function INPUT(name, value){
  this.name = name;//element.name
  this.value = value;//element.value
}

var SearchEngineWizard = {

  getFaviconFromSite : function(gBrowser){
    var favicon = 'chrome://opensearchfox/skin/default-engine.png';
    if(gBrowser.selectedTab.hasAttribute('image'))
      favicon = gBrowser.selectedTab.getAttribute('image');
    return favicon;
  },

  init : function(){
    document.getElementById('name').value = theForm.ownerDocument.title;
    document.getElementById('description').value = theForm.ownerDocument.title;
    document.getElementById('icon').src = this.getFaviconFromSite(opener.gBrowser);
	document.getElementById('searchform').value = theForm.baseURI;
  },

  getURLSpecFromFile : function(file){
    var URLSpec = Cc['@mozilla.org/network/protocol;1?name=file'].
	                createInstance(Ci.nsIFileProtocolHandler).
					  getURLSpecFromFile(file);
    return URLSpec;
  },

  pickIcon : function(){
    try{
      var iconPicker = Cc['@mozilla.org/filepicker;1'].
	                     createInstance(Ci.nsIFilePicker);
      iconPicker.init(window, '', Ci.nsIFilePicker.modeOpen);
      iconPicker.appendFilters(Ci.nsIFilePicker.filterImages | Ci.nsIFilePicker.filterAll);
      iconPicker.filterIndex = 1;
      if(iconPicker.show() == Ci.nsIFilePicker.returnOK)
        document.getElementById('icon').src = this.getURLSpecFromFile(iconPicker.file);
    }
    catch(e){
      alert(e);
      return;
    }
  },

  find_successful_controls_from_URL : function(url){
    if(url.indexOf('?') == -1) return;
    var tmp = url.substring(url.indexOf('?') + 1);
    tmp = tmp.split('&');

    for each (var i in tmp){
      var control = i.split('=');
      successful_controls.push(new INPUT(control[0], control[1]));
    }
  },

/*
function find_successful_controls:

base on:
http://www.w3.org/TR/html4/interact/forms.html#h-17.13

not considered elements:
OBJECT, IMAGE
*/
  find_successful_controls : function(successful_controls, user, form){
    var theSubmit;
    var submits = [];
	var tmp;
    successful_controls.length = 0;//clear successful_controls array if users press back
    this.find_successful_controls_from_URL(theForm.action);
//finding all submits
    for(var i = 0; i < form.elements.length; i++){
      tmp = form.elements[i];
      if(typeof(tmp.type) == 'undefined') continue;
      if(tmp.type.toLowerCase() == 'submit'){
        theSubmit = tmp;
        submits.push(tmp);
        if(prefs.getBoolPref('option1')) break;
      }
    }
//decide the only one submit button
    if(submits.length > 1){
      var msg = msgs.getString('msg2');
      msg += ' 1' + ' - ' + submits.length + '\n';
      for(var i = 0; i < submits.length; i++)
        msg += ((i + 1) +'. '+ submits[i].value + '\n');

      for(;;){
        var which = parseInt(window.prompt(msg, 1), 10);

        if(which >= 1 && which <= submits.length){
          theSubmit = submits[which - 1];
          if(window.confirm(which +'. '+ theSubmit.value + '?')) break;
        }
        else{
          window.close();
          return;
        }
      }
    }

    for(var i = 0; i < form.elements.length; i++){
      tmp = form.elements[i];
      if(typeof(tmp.type)=='undefined' || tmp.disabled || typeof(tmp.name)=='undefined')
        continue;
      if(tmp.isSameNode(user))
        successful_controls.push(new INPUT(tmp.name, '{searchTerms}'));
      else if(tmp.isSameNode(theSubmit))
        successful_controls.push(new INPUT(tmp.name, tmp.value));
      else{
        switch(tmp.type.toLowerCase()){
          case 'button' :
          case 'file' :
          case 'submit' :
          case 'image' :
          case 'reset' : break;
          case 'checkbox' :
          case 'radio' :
            if(tmp.checked)
              successful_controls.push(new INPUT(tmp.name, tmp.value));
            break;
          case 'select-multiple':
            for(var j=0; j<tmp.options.length; j++){
              var tmp_option = tmp.options[j];
              if(tmp_option.disabled) continue;
              if(tmp_option.selected)
                successful_controls.push(new INPUT(tmp.name, tmp_option.value));
            }
            break;
          case 'select-one':
          case 'hidden':
          case 'text':
          case 'password':
          case 'textarea':
          default:
            successful_controls.push(new INPUT(tmp.name, tmp.value));
        }
      }
    }
  },

  parse : function(){
    this.find_successful_controls(successful_controls, user, theForm);
  },

//function convertIconDataToBase64Format
//coded by Mook
  convertIconDataToBase64Format : function(iconURI){
    var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
    canvas.width = canvas.height = 16;
    var image = document.createElementNS("http://www.w3.org/1999/xhtml", "html:img");
    image.src = document.getElementById('icon').src;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, 16, 16);
    return canvas.toDataURL();
  },

  encodeHTML : function(obj){
    obj.value = obj.value.replace(/&/g,'&amp;');
    obj.value = obj.value.replace(/</g,'&lt;');
    obj.value = obj.value.replace(/>/g,'&gt;');
    obj.value = obj.value.replace(/"/g,'&quot;');
  },

  check : function(){
    if(!document.getElementById('name').value)
      with(theForm.ownerDocument)
        document.getElementById('name').value = title ? title : URL;
  },
/*
function createOpenSearchDescription

base on: 
http://developer.mozilla.org/en/docs/Creating_OpenSearch_plugins_for_Firefox
http://developer.mozilla.org/en/docs/Supporting_search_suggestions_in_search_plugins
*/
  createOpenSearchDescription : function(successful_controls){
    this.check();
    this.encodeHTML(document.getElementById('name'));
    this.encodeHTML(document.getElementById('description'));
    this.encodeHTML(document.getElementById('searchform'));
    var br = '\n';
    var header = "";
    var src = header +
'<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"' + br +
'                       xmlns:moz="http://www.mozilla.org/2006/browser/search/">' + br +
'<ShortName>' + document.getElementById('name').value + '</ShortName>' + br +
'<Description>' + document.getElementById('description').value + '</Description>' + br +
'<InputEncoding>' + INPUTENCODING + '</InputEncoding>' + br +
'<Image width="16" height="16">' + this.convertIconDataToBase64Format(document.getElementById('icon').src) + '</Image>' + br +
'<Url type="text/html" method="' + METHOD + '" template="' + SEARCHURL + '">' + br;
    for each (var successful_control in successful_controls)
      if(successful_control.name)
        src += '<Param name="' + successful_control.name + '" value="' + successful_control.value + '"/>' + br;
    src +=
'</Url>' + br +
//'<Url type="application/x-suggestions+json" template="' + suggestionURL + '"/>' + br +
//'<moz:SearchForm>' + document.getElementById('searchform').value + '</moz:SearchForm>' + br +
'</OpenSearchDescription>';
    return src;
  },

  writeFile : function (str_Buffer, file, charset){
    var fos = Cc["@mozilla.org/network/file-output-stream;1"].
                createInstance(Ci.nsIFileOutputStream);
    fos.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                      createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = charset;
    var chunk = converter.ConvertFromUnicode(str_Buffer);
    fos.write(chunk, chunk.length);
    fos.close();
  },

  onDone : function(){

    try{
      var nsIProperties = Cc['@mozilla.org/file/directory_service;1'].
	                        getService(Ci.nsIProperties);
      var src_file = nsIProperties.get('TmpD', Ci.nsIFile);
      src_file.append('OpenSearchFox.xml');
      this.writeFile(this.createOpenSearchDescription(successful_controls), src_file, 'utf-8');
      var nsIBrowserSearchService = Cc["@mozilla.org/browser/search-service;1"].
                                      getService(Ci.nsIBrowserSearchService);
      nsIBrowserSearchService.addEngine(this.getURLSpecFromFile(src_file),
                                        Ci.nsISearchEngine.DATA_XML, '', false);
    }
    catch(e){
      alert(e);
    }
  },
};
SearchEngineWizard.init();