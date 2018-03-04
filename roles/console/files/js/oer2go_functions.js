// oer2go_functions.js
// copyright 2018 Tim Moody

// to do
// remove phet, OER2GO from whitelist

// $("#installContentOptions .tab-pane.active").attr("id"); to get active option (between zim and oer
// requires id on <div id="installContentOptions" class="tab-content"> <!-- Start Container for Sub Menu Options Panes -->
// Install Content functions are at around 750

function getOer2goStat(){
	$.when(readOer2goCatalog(),
	       sendCmdSrvCmd("GET-OER2GO-STAT", procOer2goStat)
	).then(procOer2goCatalog);
}

function readOer2goCatalog(){
	//consoleLog ("in readOer2goCatalog");
  //consoleLog ('ran sendCmdSrvCmd');
  //if (asyncFlag === undefined) asyncFlag = false;

  var resp = $.ajax({
    type: 'GET',
    url: consoleJsonDir + 'oer2go_catalog.json',
    dataType: 'json'
  })
  .done(function( data ) {
  	oer2goCatalogDate = Date.parse(data['download_date']);
  	oer2goCatalog = data['modules'];
    //consoleLog(oer2goCatalog);
  })
  .fail(jsonErrhandler);

  return resp;
}

function procOer2goStat(data) {
	//consoleLog(data);
	oer2goInstalled = data['INSTALLED']
	oer2goScheduled = data['WIP']
}

function procOer2goCatalog() {
  //var langSelectedCodes = []; // working lookup of 2 char codes
  var selectedLangsOer2goMods = {};  // working lists of oer2go mods for each selected lang

  //consoleLog("starting selectedLangs.forEach");

  // make sure langs are selected for

  selectedLangs.forEach((lang, index) => {
    //console.log(lang);
    //langSelectedCodes.push(langCodes[lang].iso2); // ? not needed
    selectedLangsOer2goMods[langCodes[lang].iso2] = [];
  });

  //consoleLog("starting for (var item in oer2goCatalog)");
  for (var item in oer2goCatalog) { // create lists of modules belonging to selected lans
    var lang = oer2goCatalog[item].lang;
    var moddir = oer2goCatalog[item].moddir;
    //console.log(item);
    //console.log(lang);
    if (lang in selectedLangsOer2goMods) {
    	if (oer2goCatalogFilter.indexOf(oer2goCatalog[item].type) >= 0) // don't add zims and other items handled by other providers
    	  selectedLangsOer2goMods[lang].push(moddir);
    }
  }

  //consoleLog("starting selectedLangs.forEach");
  var html = "<BR>";
  selectedLangs.forEach((lang, index) => { // now render the html
  	var iso2 = langCodes[lang].iso2;
  	//console.log(lang, iso2);
  	if (iso2 in selectedLangsOer2goMods)
  	  html += renderOer2goItems(lang, selectedLangsOer2goMods[iso2]);
  	  //console.log(html);
  });

  $( "#Oer2goDownload" ).html(html);
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({
      animation: true,
      delay: {show: 500, hide: 100}
    });
  });
}

function renderOer2goItems(lang, mods) {
	var html = "";
	// lang header
	html += "<h2>" + langCodes[lang]['locname'] + ' (' + langCodes[lang]['engname'] + ")</h2>";
	// sort mods
  //console.log(mods);
  mods = mods.sort(function(a,b){
    if (oer2goCatalog[a].title < oer2goCatalog[b].title) return -1;
    else return 1;
    });
	// render each mod
	mods.forEach((mod, index) => { // now render the html
  	//console.log(mod);
  	var item = oer2goCatalog[mod];
  	//html += oer2goCatalog[mod].title + "<BR>";
  	html += renderOer2goItem(item);
  });

	return html;
}

function renderOer2goItem(item) {

  var html = "";
  var colorClass = "";
  var colorClass2 = "";
  //console.log(item);
  var itemId = item.moddir;

  if (oer2goInstalled.indexOf(itemId) >= 0){
    colorClass = "installed";
    colorClass2 = 'class="installed"';
  }
  if (oer2goScheduled.indexOf(itemId) >= 0){
    colorClass = "scheduled";
    colorClass2 = 'class="scheduled"';
  }
  html += '<label ';
  html += '><input type="checkbox" name="' + itemId + '"';
  //html += '><img src="images/' + zimId + '.png' + '"><input type="checkbox" name="' + zimId + '"';
  if ((oer2goInstalled.indexOf(itemId) >= 0) || (oer2goScheduled.indexOf(itemId) >= 0))
    html += 'disabled="disabled" checked="checked"';
  if (selectedOer2goItems.indexOf(itemId) >= 0)
    html += ' checked="checked"';

  html += 'onChange="updateOer2goDiskSpace(this)"></label>'; // end input
  //var zimDesc = zim.title + ' (' + zim.description + ') [' + zim.perma_ref + ']';
  var itemDesc = item.title + ': ' +item.description;
  //html += '<span class="zim-desc ' + colorClass + '" >&nbsp;&nbsp;' + zimDesc + '</span>';

  var oer2goToolTip = genOer2goToolTip(item);
  html += '<span class="zim-desc ' + colorClass + '"' + oer2goToolTip + '>&nbsp;&nbsp;' + itemDesc + '</span>';

  //html += '<span ' + colorClass2 + 'style="display:inline-block; width:120px;"> Date: ' + zim.date + '</span>';
  html += '<span ' + colorClass2 + ' style="display:inline-block; width:120px;"> Size: ' + readableSize(item.ksize) + '</span>';
  if (oer2goInstalled.indexOf(itemId) >= 0)
    html += '<span class="' + colorClass + '">INSTALLED';
  else if (oer2goScheduled.indexOf(itemId) >= 0)
    html += '<span class="' + colorClass + '">WORKING ON IT';
  else
  	html += '<span> <a href="' + item.index_mod_sample_url + '" target="_blank">Sample</a>';
  html += '</span><BR>';


  return html;
}

function genOer2goToolTip(item) {
  var oer2goToolTip = ' data-toggle="tooltip" data-placement="auto top" data-html="true" ';
  oer2goToolTip += 'title="<h3>' + item.title + '</h3>' + item.description + '<BR><BR>';
  oer2goToolTip += 'Language: ' + item.lang + '<BR>';
  oer2goToolTip += 'Category: ' + item.category + '<BR>';
  oer2goToolTip += 'Age Range: ' + item.age_range + '<BR>';
  oer2goToolTip += 'Rating: ' + item.rating + '<BR>';
  oer2goToolTip += 'Version: ' + item.version + '<BR>';
  oer2goToolTip += 'Size: ' + readableSize(item.ksize) + '<BR>';
  oer2goToolTip += 'Number of Files: ' + item.file_count + '<BR><BR>';
  //oer2goToolTip += 'Sample URL: <a href="' + item.index_mod_sample_url + '">Click Here</a><BR>';

  //oer2goToolTip += 'Media: ' + Intl.NumberFormat().format(item.mediaCount) + '<BR>';
  //oer2goToolTip += 'Download URL: ' + item.download_url + '<BR>';
  //oer2goToolTip += 'With:<ul>';
  //oer2goToolTip += item.has_embedded_index ? '<li>Internal Full Text Index</li>' : '';
  //oer2goToolTip += item.has_video ? '<li>Videos</li>' : '';
  //oer2goToolTip += item.has_pictures ? '<li>Images</li>' : '';
  //oer2goToolTip += item.has_details ? '<li>Complete Articles</li>' : '';
  //oer2goToolTip += '<table><tr><td>Full Text Index</td><td>' + item.has_video ? "&#10003;" : "X";
  //oer2goToolTip += '</li></ul></b>"'
  //oer2goToolTip += '</ul></b>"'
  //oer2goToolTip += 'title="<em><b>' + item.description + '</b><BR>some more text that is rather long"';
  oer2goToolTip += '"'
  return oer2goToolTip;
}

function instOer2goItem(mod_id) {
  var command = "INST-OER2GO-MOD"
  var cmd_args = {}
  cmd_args['moddir'] = mod_id;
  cmd = command + " " + JSON.stringify(cmd_args);
  sendCmdSrvCmd(cmd, genericCmdHandler());
  oer2goScheduled.push(mod_id);
  procOer2goCatalog();
  return true;
}

function sumCheckedOer2goDiskSpace(){
  var totalSpace = 0;

  for (var i in selectedOer2goItems){
    var mod_id = selectedOer2goItems[i]
    var mod = oer2goCatalog[mod_id];
    var size =  parseInt(mod.ksize);

    totalSpace += size;
  }
  // sysStorage.oer2go_selected_size = totalSpace;
  return totalSpace;
}

function updateOer2goDiskSpace(cb){
  var mod_id = cb.name
  updateOer2goDiskSpaceUtil(mod_id, cb.checked);
}

function updateOer2goDiskSpaceUtil(mod_id, checked){
  var mod = oer2goCatalog[mod_id]
  var size =  parseInt(mod.ksize);

  var modIdx = selectedOer2goItems.indexOf(mod_id);

  if (checked){
    if (oer2goInstalled.indexOf(mod_id) == -1){ // only update if not already installed mods
      sysStorage.oer2go_selected_size += size;
      selectedOer2goItems.push(mod_id);
    }
  }
  else {
    if (modIdx != -1){
      sysStorage.oer2go_selected_size -= size;
      selectedOer2goItems.splice(mod_id, 1);
    }
  }

  displaySpaceAvail();

}

function setOer2goDiskSpace(html){
  html += "Estimated Space Required: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

  html += "<b>" + readableSize(sysStorage.oer2go_selected_size) + "</b>"
  $( "#oer2goDiskSpace" ).html(html);
}
