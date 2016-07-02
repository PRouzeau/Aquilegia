/** 
@preserve Aquilegia (c)Pierre ROUZEAU 2016 License GPL 2.0 or any later version
* Complete help system using simple wiki markup - 29 June 2016. Need JQuery 2.2.1
* Original work. Does include internal and external links, search tool and search stack
*/
/* strings to be translated - accented letters only managed for french, yet...
"There is no available help page for this element"
"<b>{0}</b> found in following pages:"
"<b>{0}</b> was not found"
"Search: "
"Help page '{0}' cannot be loaded"
"Link \"{0}\" length exceed "
*/
/** @private */
var aqlC = {}; // constant parameters
/** @private */
var aqlO = {}; // object for variable parameters
/** @private */
var tabHlp={}; // storage of pages, titles, search authorisation and title section toggle
aqlC.version = "Beta1";
aqlC.linkMaxLength = 24; // maximum number of character for a link name (due to file length limitation= 30-2 for 'h/'-4 for'.txt')
aqlC.sweb   	= '•'; // U+2022 symbol at the end of a web link - well supported by fonts, possible ○
aqlC.slink  	= '▫'; // U+25AB symbol at end of ▫ isinternal link  well supported and on the left U+25C2 too much on the right - U+25B6;
aqlC.excluAllWeb= /aquilegia/i; // Regex to exclude links from the all web link search, use '|' to exclude multiple words 
aqlC.docDir   	= "pdf/";  // subdir of docs (pdf) linked to images, calling image (in aqlC.dispDir) shall have same name (but != extension)
aqlC.prefix   	= "hlp/"; // Used for hash writing and deep linking - discriminate from other Bootstrap pages - unrelated to aqlC.dir
aqlC.dir      	= "h/"; // directory where the help file is located
aqlC.imgLocalDir= "f/";  // sub-directory of h/ for images when the resources are local - may be identical to thumbnail images to limit file size
aqlC.dispDir 	= "d/";  // sub-directory of h/ for **displayed** images (they shall have same name as full images)

aqlO.imagesDir	= "f/";  // sub-directory of h/ for linked images  ('full' images) Fall to imgLocalDir
//aqlO.domain  = "http://otocoup.com/DWC/"; // define domain for remote help loading. Need CORS activated on directory
aqlO.domain		= ""; // name of cross-origin domain from files are got - fallback to ""
aqlO.url		= "";  //page url base set by the first showHlp, which loads file and check availability
aqlO.linkbase	= ""; //page Url WITHOUT hash code
aqlO.lastP 		= 'hlptoc'; //hlp_toc; //at startup  there is no last page-> will go on toc - shall be blank to initialize events
aqlO.nFound		= []; // pages which are not found
aqlO.nValid		= []; // pages which are found but not valid
aqlO.loadTime 	= 0; // page loading + splitting time, ms
aqlO.listAll 	= false; // flag when we run a search all pages to not build toc, preformatted blocks, etc.
aqlO.isModal  = true;
aqlO.dispMenu = false; //?? set all flags in a hash table ?
aqlO.zoom = 1.35; // only on touchscreen equipment

var htextnohlp = T("There is no available help page for this element")+"<br>";
//pages with same identity and hide others. If this is empty, all paragraph are shown
var hlpSelId = ""; //e.g. "Duet_0.85"; Chars allowed:[\w-.] select paragraphs identifier to display 
var is_touch_device = 'ontouchstart' in document.documentElement; // may be not reliable, but simple

//TODO: define a standard to execute utility non static pages: Search,  display list, print list with showHlp()  instead of specialised functions

//var hlpSetvW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
/* var hlpT, hlptc; // debugging execution time (for regular expressions)
function t(init) { //Send time to console. t(1); initialise, successives t(); gives time from initialisation
	if (init) { hlpT=hlptimenow(); hlptc=0} console.log('point: ', (hlptc++)," :",Math.round(hlptimenow()-hlpT)); } //*/
hlpAccents="";// lowercase accent set for localisation These are the char allowed in the link text. Other char WILL FAIL link.
//const hlpAccents='éèêëáàâïôçüûúùÿœ';  // French accented letters set
//const hlpAccents='áéíóúüñ';  // Spanish accented letters set
//const hlpAccents='äöüß';  // German
//const hlpAccents='àéèìòóù';  // Italian
//const hlpAccents='àáâãéêíóôõúüç';  // Portuguese
//const hlpAccents='åäö';  // Swedish + finnish
//const hlpAccents='æåœø';  //Danish + Norwegian
//money char '€$£';
const hlpAUp = hlpAccents.toUpperCase(); 

aqlO.debugT = (typeof performance.now === 'function');// performance.now() crashes Android browser -> set false
function hlptimenow() {return (aqlO.debugT)?performance.now():0}; 

function hlp_open() { //at first call to showHlp, after file load. Will never trigger without file.
	if (aqlO.isModal) {
		$("#aql_page").modal(); 
		$('#aql_body').scrollTop(0);// if anchor empty, go to top (call # don't work)	
	}
}
function hlp_is_open() { //detect help windows is open - better manage a flag ??
	return ($("#aql_page").data('bs.modal') || {}).isShown ;
}
function hlp_close() { //occurs when back button didn't get proper hash (no aqlC.prefix)
	$("#aql_page").modal('hide'); 
}

function z(val) {return (val||'');} //just make empty strings of undefined
function zo(obj) {return (obj==undefined)? new Object():obj;} //make empty object of undefined

$(document).ready(function(){
	if (!($("#aql_page").hasClass("modal")))  
		aqlO.isModal=false;
	if (is_touch_device) {
		$("#aql_page").addClass("modal-fullscreen-touch");
		$("#aql_page").removeClass("modal-fullscreen");
		$("#btn_hlp_vW").css('display','inline'); // work only on chrome
		$('head').append('<meta name="viewport" content="initial-scale=1">');
		$('head').append('<meta name="viewport" content="initial-scale='+aqlO.zoom+'">');
		$(document).trigger('create');
		// 2nd run on viewport readjust margins with Chrome browser, if run first, page is zoomed
		if (!aqlO.isModal) { // make the full window scrolling
			$("#aql_body").css("overflow", "hidden");  /* Firefox*/
		/*	$("#aql_body").css("height", "100%"); */
			$("#aql_cont").css("overflow", "auto");  /* Firefox */
			$("#aql_cont").css("position", "relative"); 
			$("#aql_body").css("top", "0");  /* needed by Firefox*/
			$("#aql_body").css("position", "relative"); 
		}
	/*	else 	 {  // fail to have whole window scrolling while having Bootstrap modal.. Look  general scroll
			$('.modal-fullscreen').css("overflow", "auto"); 
			$('.modal-fullscreen').css("height", "inherit"); 
			$('.modal-content').css("height", "inherit");  
			$('.modal-dialog').css("height", "inherit");  
			$('.modal').css("position", "absolute !important"); 
		}	*/
	}
	$("#aql_alert").click(function(){ // Alert window - will it trigger the popup blocker ?
		$(this).css('display', "none");
    });
	window.onresize = function() { // also run by the openWin
		if ((window.innerWidth < 900)||!aqlO.dispMenu) {
			$('#aql_menu').css('display','none');
			$('#aql_body').css('margin-left',0);
		}
		else  { 
			$('#aql_menu').css('display','inline');
			$('#aql_body').css('margin-left','165px');
		}
	}
	$("#btn_hlp_vW").click(function(){ // Zooming button - work only on Chrome mobile
		aqlO.zoom = aqlO.zoom*1.15; //abandoned: hlpSetvW = hlpSetvW*0.925;
		//$('meta[name=viewport]').attr('content', "width="+hlpSetvW+", initial-scale=1");
		$('meta[name=viewport]').attr('content', "initial-scale="+aqlO.zoom);
		$(document).trigger('create');
    }); 
	$(".hlpstart").click(function(e){ //APPLICATION  call widget  set class '.hlpstart' in widget
		var hpage =  $(e.target).data('hpage'); 
		showHlp(hpage, true);
    }); 
	$("#aql_page").on('shown.bs.modal', function(){ // only run at first opening
	    if (!is_touch_device) // don't focus on touch device, as its starts the keyboard
			$("#hsearch").focus();
		$('#aql_body').scrollTop(0);
    });
	$("#btn_hlp_back").click(function(){
		history.back();
    }); 
	$("#btn_hlp_toc").click(function(){
		if (aqlO.lastP!='hlptoc') // to stop toggling
			hlpSetContent ('hlptoc');
		$('#aql_body').scrollTop(0);
    }); 
	$("#btn_hlp_print").click(function(){
		hlpPrint();
    }); 
	$("#hform").on('submit',function(e){ 
		e.preventDefault(); //prevent submission of search, treated within Javascript 
		hlpSendSearch();
	});
	$(window).bind("popstate", function(){ //back or forward button activated
		var u = window.location.hash.split('#'+aqlC.prefix)[1]; // don't do anything of address not compliant
		if (u)
			showHlp(u, false, true); // 2nd param stop restacking address
		else if (hlp_is_open())
			hlp_close();
	});
	var url = window.location.href; 
	aqlO.linkbase = url.split('#', 1)[0];
	if (url.match('#'+aqlC.prefix)) { //deep linking: beware, this intercept all hash code for whole Bootstrap page 
		if (url.split('#'+aqlC.prefix)[1]) //note that the prefix name is unrelated to page file location
			showHlp(url.split('#'+aqlC.prefix)[1]);
		else if (!aqlO.isModal) // if no page in link and plain page, we start anyway
			showHlp('hlptoc'); // start the page	
	}		
	else if(!aqlO.isModal) // if a plain page, we start anyway
		showHlp('hlptoc'); // start the page
});

function hlpCreEvents() { // shall be run after the html component creation (after set content)
	if (tabHlp[aqlO.lastP].clp) //set at last position collapsed/uncollapsed title sections 
		for (var id in tabHlp[aqlO.lastP].clp)
			if (tabHlp[aqlO.lastP].clp[id]) {
				$('#'+id).parent().find(".hlpsec").filter(":first").toggle();
				$("span", '#'+id).toggleClass("h-expand h-collapse");
			}	
	$(".hlptt").unbind('click'); // troubles without that		
	$(".hlptt").click(function(e){ //id incorporate page name to differentiate menu from page 
		var idx = this.id;
		$(this).parent().find(".hlpsec").filter(":first" ).toggle();
		$("span", this).toggleClass("h-expand h-collapse");
		if (!tabHlp[aqlO.lastP].clp) tabHlp[aqlO.lastP].clp ={}; // memorize toggling in hash table
		tabHlp[aqlO.lastP].clp[idx] = (tabHlp[aqlO.lastP].clp[idx]) ? !tabHlp[aqlO.lastP].clp[idx] : true;
	});
}

//==== functions which may be called from html ================================= 
window.showHlp = function() { // main function calling help page
var lines, hlpLoading, lnk=arguments[0];
	var openWin = arguments[1]; //if true we are opening help window. sent after text load
	var stateChange = arguments[2]; // if true, we shall not do again a hash change
	var mt = lnk.match (/(.[^!]*)!?(.*)/); // with '!' as anchor char
	hlpLoading=mt[1].trim().toLowerCase(); // page without anchor
	if (hlpLoading=='hlplast') // if call for last page
		hlpLoading = aqlO.lastP;
    if (!tabHlp['hlptoc']) { // test if 'toc' page which always exist is loaded
		aqlO.url = aqlO.domain+aqlC.dir;
		aqlO.loadTime = hlptimenow(); 
		$.ajax(aqlO.url + 'hlp.txt', {  // load help content
			dataType: "text",
			global: false,
			success: function(response, status) { 
				if ((response||"").substr(0,5)=="<!DOC") //if file not found Duet server DO answer with a 404 page and status = "success"
					hlpnoload(aqlO.url+'hlp.txt', "", ""); // so we intercept the html page - weird
				else {	//var h=[]; // First line is the title and used for specific search.
					var h=(response||"").split(/■/);
					for (var i=1; i<h.length; i++) 
						hlpStore(h[i]);
					if(!tabHlp['hlptoc'])
						hlpalert(T("'hlp.txt' file loaded, but page :{0} was not found, check also html charset (shall be utf-8)",'hlptoc'));	
					aqlO.loadTime = Math.round (hlptimenow()-aqlO.loadTime); 	
					showHlp(lnk, true); //rerun after load: 2nd parameter tells to open the help window 'lnk' contain anchor 
				}	
			},
			error: function(xhr, status, error) { // callback function while page NOT loaded
				if (aqlO.domain.trim()) {  //test if we are trying from a remote address
					aqlO.domain=""; // aqlO.url will be re allocated at rerun
					aqlO.imagesDir = aqlC.imgLocalDir; // change directory on local (to have same as thumbs dir)
					showHlp(lnk); // rerun in local if fail to load on remote
				}	
				else {
					hlpnoload(aqlO.url+'hlp.txt', xhr.responseText, error); 
				}	
			} 
		});
	} else if (!tabHlp[hlpLoading]) { // page not in hash table, so load as external attempt
		$.ajax(aqlO.url + hlpLoading +'.txt', {  // load help content
			dataType: "text",
			global: false,
			success: function(response, status) { // callback function while page loaded
				if (response.substr(0,5)=="<!DOC") { //if no page DWC DO answer with a 404 page and success!
					arrayAdd (aqlO.nFound, hlpLoading);
					hlpnoload(aqlO.url+hlpLoading, "", "");
				}	
				else {	
					hlpStore (response, hlpLoading);
					if(tabHlp[hlpLoading]) { // page may not be created if empty, not format compliant, etc.
						tabHlp[hlpLoading].ext="(ext)";
						showHlp(lnk, openWin); //rerun after load 'lnk' contain anchor
					}
					else
						hlpnoload(aqlO.url+hlpLoading, "Page empty or corrupted", "");
				}
			},
			error: function(xhr, status, error) { // callback function while page NOT loaded
				arrayAdd (aqlO.nFound, hlpLoading);
				hlpnoload(aqlO.url+hlpLoading, xhr.responseText, (aqlO.domain) ? error :'');  // error shown if call from cross origin
			}
		});
	}
	else { // help already loaded
		if (openWin) {// Before setContent to have events defined for collapsing sections in menu
			if (tabHlp['hlpmenu']) {
				$('#aql_menu').html(hlpTrans(z(tabHlp['hlpmenu'].p), 'hlpmenu'));
				aqlO.dispMenu=true;
			}
			window.onresize(); // to define properties at start, according  aqlO.dispMenu
		}	
		if ((hlpLoading!=aqlO.lastP)||openWin) //stop reloading of page (if calling a local anchor, notably)
			hlpSetContent (hlpLoading, openWin, stateChange);  // change content as needed
		if  (openWin) // Help window first opening
			hlp_open();
		if (mt[2])	// Scroll to anchor if required
			location.hash='#'+aqlC.prefix+hlpLoading+'!'+mt[2].toLowerCase(); // automatically stack anchor in history
		else // if anchor empty, go to top
			$('#aql_body').scrollTop(0);
	}		
}

//==== Other functions =====================================================================================
function hlpStore(page, index) { //Store in hash table.  index exists only for independant pages (file name)
   	page = (page||"").replace(/\r\n?/g,'\n'); //required
	var lines = page.split(/\n/,2); //split only two strings
	if (lines.length>1){ //if page exists
		var index2 = lines[0].split(/\s/)[0].trim().toLowerCase(); //split [1], split[2] .. will be groups
		if (index && index!=index2) {
			alert ("Page name:"+index2+" not the same as file name:"+index+" Check first file line");
			index2=index; // to avoid looping indefinitely
		}	
		page = page.replace(/(.*\n)/,"");
		if (tabHlp[index2]==undefined) // create object as needed
			tabHlp[index2]={};
		if (lines[1].substr(0,2)=='->') // if  redirect
			tabHlp[index2].p = page; 
		else
			tabHlp[index2].p = page.replace(/(.*\n)/,""); // 1rst line is title, removed
		tabHlp[index2].title=lines[1].replace(/^\s*=*\s*(.+?)\s*$/, '$1'); // second line is title line
		return true;
	} 
	arrayAdd (aqlO.nValid, index);
	return false;	
}

function hlpnoload(page, xhra, err) { //message if page cannot load 
	xhra = (xhra||"").replace(/(<[\/]?h1>)/g,'°')
					.replace(/(<.*?>)/g,'')
					.replace(/(°)/g,'<br>'); //filter out html headers if a web page
	hlpalert(T("Help page '{0}' cannot be loaded", page)+'<br>"'+xhra+'"<br>'+(err||"")); 
}

function hlpalert(txt) { // not recursive, not dynamic, last alert wins
	$("#halertext").html(txt);
	$("#aql_alert").css("display","block");
}

function hlpSendSearch() { // Run the search from text field data
	var stext = document.getElementById("hsearch").value; // search key
	if (tabHlp['hlpsearch']==undefined) // create object as needed
		tabHlp['hlpsearch']={};
	tabHlp['hlpsearch'].search=false; // don't search search page		
	if (stext) {
		tabHlp['hlpsearch'].title = accentsNorm(stext.toLowerCase()); // accented letters normalised and everything in lowercase
     	hlpLoadAll("hlpShowSearch"); //load all pages before searching
	}
}

function hlpShowSearch() {
	tabHlp['hlpsearch'].p=searchHlp(); // fill in search page
	showHlp('hlpsearch');
}

function hlpDefAnchor (hpage, a) { // for anchors special chars are replaced by a dot followed by hex code, like wikimedia
    a= a.replace (/\s+/g,'_').toLowerCase(); // space replaced by underscores
    a= a.replace (/[^\w-]/g, function (match) { //replace special char by'.'+hex code. DOTS ARE ESCAPED
		return ('.' + match.charCodeAt(0).toString(16)); //code char -> .Hex 
	});
	return aqlC.prefix+hpage+'!'+a; // no # in the name, only in the call
}
function hlpAnchor (hpage, a) {
	return '<a name="'+ hlpDefAnchor(hpage,a)+'"></a>';
}
function hlpGoAnchor (hpage, a, text) {
	return '<a href="#'+hlpDefAnchor(hpage,a)+'">'+text+'</a>';
}	

function hlpTrans (data, hpage) {//simple wiki markup w/ pdf, images references & web links
// \s capture the \n, so [\t ] is used to catch spaces only
var intro, ptitle, hlpdiag, notoc, notitle, nofoot, nohead, allweb; //blocs and directives
var myclass, hlpfoot, hlphead; // parameters of directives
var refidx=0, notesidx=0, weblnk, weblnk1, weblnk2; //notes and web link lists
var codeblocks=[],tmp=[],titles=[],weblinks=[],weblinkis=[],tables=[],refs=[],notes=[]; //data storage while tokenising
var i, j, cleardiv="<div style='clear:both;'></div>" , now = hlptimenow(); 
var imgdisp, rgximg, rgximglnk, imgtg ='" target="_blank">'; // image links
imgtg = '">'; //Target:  on Duet, opening another window makes like if it was external link - make it an option ?? 
//-- Functions -------------------------------------------------------------------------------------
	function direct (dir) { // search directive once:  return parameters as a unique string. return empty string if not found
		var a="", par1=""; 
		var redir = RegExp("\\(:"+dir+"(([ ]+[\\w]*)*):\\)[ ]*(<br>)*[ ]*"); //clean \n and spaces, don't remove \n as separator for titles
		data = data.replace (redir, function(mt, p1) {
			a = mt; // run only once, no 'g'
			par1 = (p1||"");
			return ""; // delete directive
		});
		return (a)?((par1)?par1:dir):""; // return directive name if directive exists but have no parameter
	}
	function untoken (arr, token) {
		for (i=0; i<(arr||"").length ; i++)
			data =data.replace (token,arr[i]); 
	}
	function addlistref (arr, regx, anch){ // make a numbered list of references - for refs and notes
		var lst = "";
		return data.replace(regx, function() { 	// what if no match for (:reflist:) and (:notes:) and refs exists ??	
			if (arr.length) {
				for (i=0; i<arr.length ; i++)
					lst += '<li>'+ hlpGoAnchor(hpage, 'b'+anch+(i+1), '↑ ')+'&nbsp;'+
						hlpAnchor (hpage, anch+(i+1))+arr[i]+'</li>';
				lst = '<ol>'+lst+'</ol>';
			}
			return lst;
		}); 
	}
	function imgwd (width) { // calculate maximum allowed image width - and close html string
		return '" style="width:'+ Math.min(window.innerWidth*0.92,z(width)) +'px;"/>';
	}
//-------------------------------------------------------------------------------------------------	
	if (tabHlp[hpage]==undefined) alert("internal error program, page undefined in hlpTrans function");
	if (!direct ('nodef')) {// don't load default page - default may contains directives
		data=z(zo(tabHlp['hlpdef']).p)+data; //add default page at start - this is different from a header, as it goes in 'intro' block ???
	}	
	myclass  = direct('class');  // all directives after loading default pages
	hlpfoot  = direct('hlpfoot'); 
	hlphead  = direct('hlphead'); 
	nofoot 	 = direct('nofoot'); // to stop adding footer, precedence on hlpfoot
	nohead 	 = direct('nohead'); // to stop adding header, precedence on hlphead
	notitle	 = direct('notitle'); 
	notoc 	 = direct('notoc');	
	allweb   = direct('allweb');	
	numtitle = direct('numtitle'); 
	numtitle = (numtitle && !direct('nonum')); // nonum directive have precedence on numtitle
	hlpdiag  = direct('hlpdiag');
	tabHlp[hpage].search = !direct ('nosearch'); // page is authorized for search
	//-- directives before page inclusion, avoiding included page directives --
	data = data.replace (/<<([\s\S]*?)>>/g, function (mt) {  // token codeblocks before directive processing
		tmp.push(mt); // is that really useful for a quite rare encounter (only in syntax page ??)
		return '▲';
	});
	//-- Sub pages inclusion -- don't retrieve the titles ---------------------------------
	data=data.replace(/\(:include\s([\w-]*?):\)/g,  function(mt, p1) {
		return z(zo(tabHlp[p1.trim().toLowerCase()]).p); //Return values, not boolean
    });
	//-- block markups -------------------------------------------------------------------
	untoken (tmp,'▲'); // untoken after processing directive, because it shall be redone after page inclusion
	data = data.replace (/<<\n?([\s\S]*?)>>(\n(?=\w))?/g, function (mt, p1) { //don't remove newline if not word char
		var iclass = (p1.indexOf('\n')<0) ? ' class="inline"' :''; // if no newline -> inline stuff
		codeblocks.push('<pre'+iclass+'><code>'+ p1 +'</code></pre>'); // in a <pre> block, '/n' are taken into account
		return '▲'; //U+25B2
	});
	data=data.replace(/\/\*.*?\*\//g, ''); // /*Comments*/  non greedy
	data=data.replace(/%([A-F0-9]\d)/g,'·$1'); //replace % by char 250 for Hex encoding- protection of URI encoding as % is used in markup
	// left for unrecognised web links .. any use ??
	data=data.replace(/_\n/g,''); // continue without taking into account line feed - NO added space (for tables)
	exch2 = /^[\w-.]*\/=([\s\S]*?)=\//gm;  //catch everything in selected paragraphs (includes \n)
	if (boardResponse) // from DWC poll ??
		hlpSelId = boardResponse.replace (/\s+/g,'_'); 
	if (hlpSelId) {// there is an id - 
	    exch = new RegExp('^'+hlpSelId+'\\/=([\s\S]*?)=\\/','gm');
		data=data.replace(exch, '$1').replace(exch2,''); //validate paragraph with id, then remove others
	}	
	else 
		data=data.replace(exch2, '$1'); // display all para content	if no selector	
	//-- Title tokenisation -------------------------------------------------------------
	data = data.replace (/^={2,4}[>|<]?[\t ]*([^\n]+)/gm, function (mt) {
		titles.push(mt); 
		return '♦';  //U+2666
	}); 
	//-- External links and image markup --- no link within titles  ---------------
	var repdf = /(\d+)([LC]{0,1})%pdf%(([\w-\.]*\/){0,4}[\w-\.]+\.)(png|jpg|svg)/g; //capture image
	data=data.replace(repdf, function(m, p1,p2,p3,p4,p5) {
		return '<a href="'+aqlO.url+aqlC.docDir+z(p3)+z(p2)+imgtg+ 
		'<img class="hlpimg'+z(p2)+'" src="'+aqlO.url+aqlC.dispDir+z(p3)+z(p5)+imgwd(p1)+
		'</a>';
	});
	rgximg  = /(\d+)([LC]{0,1})%(([\w-\.]*\/){0,4}[\w-\.]+\.)(png|jpg|svg)/g; //capture image
	data=data.replace(rgximg, function(m, p1,p2,p3,p4,p5) { 
		return '<a href="'+aqlO.url+aqlO.imagesDir+z(p3)+z(p5)+imgtg+
		'<img class="hlpimg'+z(p2)+'" src="'+aqlO.url+aqlC.dispDir+z(p3)+z(p5)+imgwd(p1)+
		"</a>";
	});	
	rgximg = /(\d+)([LC]{0,1})%%(([\w-\.]*\/){0,4}[\w-\.]+\.)(png|jpg|svg)/g; //capture image without link	
	data=data.replace(rgximg, function(m, p1,p2,p3,p4,p5) {
		return '<img class="hlpimg'+z(p2)+'" src="'+aqlO.url+aqlC.dispDir+z(p3)+z(p5)+imgwd(p1);
	});
	rgximglnk = /%([^%\n]*)%(([\w-\.]*\/){0,4}[\w-\.]+\.)(png|jpg|svg)/g; //word link to image	
	data=data.replace(rgximglnk,'<a href="'+aqlO.url+aqlO.imagesDir+'$2$4'+imgtg+'$1</a>'); // link to local image (= 'Media:' markup on wikimedia)
	//alert (data);	
	//-- Web links ------------------------------------------------------------------------------------------
	//var rlk1= /%([^%\n]*)%"(http(s?)\:[^"]*)"/g; //this Regex capture not valid web addresses - may check validity at later phase? 
	var rlk2= /"(#?)(.*?)[\t ]*(http(s?)\:\/\/)(([\da-z\.-]+)\.([a-z\.]{2,6})[^"]*)"/g;  //could we get optional http if run before image link ?  
	var rlk3= /(http(s?)\:\/\/)(([\w\.-]+)\.([\w\.\?\=]{2,6})[\S]*)/g;  // Isolated link without " "
	data=data.replace(rlk2,function (mt,p1,p2,p3,p4,p5) { // tokenize and replace links -> help for search
		weblnk = 'http'+(p4||"")+'://'+(p5||"");
		p2 = (p2)?p2.trim()+aqlC.sweb :""; // format link text
		weblnk1 = '<a href="'+weblnk+'" target="_blank">'+p2+((!p2)?weblnk:"")+'</a>'; // if no text, display address
		weblnk2 = '<a href="'+weblnk+'" target="_blank">'+p2+weblnk+'</a>'; //always address
		if (p1) {// prefix '#' present
			refs.push(weblnk2); //store references for future display
			weblinks.push(hlpAnchor(hpage, 'bxref'+(++refidx))+
				hlpGoAnchor(hpage, 'xref'+refidx, '['+refidx+']'));
		}	
		else {
			weblinks.push(weblnk1+((allweb)?hlpAnchor(hpage, 'bxref'+(++refidx))+'['+refidx+']':"")); 	
			if (allweb) 
				refs.push(weblnk2); // list all links
		}	
		return '♥'; //U+2665
	}); 
	data=data.replace(rlk3,function (mt,p1,p2,p3) { // tokenize and replace links -> help for search
		weblnk = '<a href="http'+p2+'://'+p3+'" target="_blank">'+p3+aqlC.sweb+'</a>';
		weblinkis.push (weblnk);
		return '▼'; //U+25BC  
	});
	//-- tables ----------------------------------------------------------------------------------------------
	data = data.replace (/^\/:([\s\S]*?)^:\//gm, function (mt, p1) { // before character formatting ?? 
		tables.push(hlpTable(p1)); 
		return '♠'; //U+2660
	});
	//-- simple markups -------------------------------------------------------------
	data=data.replace(/^----/gm,'<hr>'); // shall precede -- something-- markup, if defined anyday
	data=data.replace(/<q>([\s\S]*?)<\/q>/g, function(mt, p1) { //  quote and blockquote
		return (z(p1).match(/\n/))?'<blockquote>'+z(p1)+'</blockquote>':mt; // became a block quote if there is \n in
	});
	data=data.replace(/\/\/(([^\/]|\/[^\/])*)\/\//g, '<em>$1</em>');//  //Emphasize(italic)//
	data=data.replace(/__(([^_]|_[^_])*)__/g, '<u>$1</u>');//  __underline__
	data=data.replace(/\b([a-y]+)\^\^(([^\^]|\^[^\^])*)\^\^/g, '<span style="background:$1">$2</span>'); // color^^highlight^^
	data=data.replace(/\^\^(([^\^]|\^[^\^])*)\^\^/g, '<mark>$1</mark>'); // yellow ^^highlighting^^
	data=data.replace(/^:(.*)/gm,'<div class="hlpindent">$1</div>'); //: indented para
	data=data.replace(/^\*[\t ]*(.*)\n/gm,'<ul><li>$1<\/li><\/ul>'); // bullet list
	data=data.replace(/<\/li><\/ul><ul><li>/g,'</li><li>'); 
	data=data.replace(/^#[\t ]*(.*)\n/gm,'<ol><li>$1<\/li><\/ol>'); // numbered list
	data=data.replace(/<\/li><\/ol><ol><li>/g,'</li><li>'); 
	data=data.replace(/<\/h([345r])>\n/g,'</h$1>'); // remove line feeds from title lines
	data=data.replace(/<\/ul>\n/g,'</ul>');
	data=data.replace(/<\/ul>\n/g,'</ul>'); //remove line feed twice after li
	data=data.replace(/<\/ol>\n/g,'</ol>');
	data=data.replace(/<\/ol>\n/g,'</ol>'); //remove line feed after li
	data=data.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // **strong** characters AFTER bullet list
	//-- internal links --------------------------------------------------------------
	var re0 = /( |>|\n)"#[\t ]*?(([\[\],\wéèêëàâïôœçùÀÉÈÊË°&:?\(\)\/\-\.:!']+[\t ]*)*)"/g; // notes
	var re1 = /( |>|\n)%(([\[\],\wéèêëàâïôœçùÀÉÈÊË°&:?\(\)\/\-\.:!']+[\t ]*){1,12})%(([\w-]*![\w-.]*[\w-]+)|([\w-]+))/g;
	var re2 = /([\[\],\wéèêëàâïôœçùÀÉÈÊË°&:?\-\.:\(\)'!]+)%(([\w-]*![\w-.]*[\w-]+)|([\w-]+))/g; 
	data=data.replace(re0, function (mt,p1,p2) { 
		notes.push(p2); //store notes for future display
		return p1 + hlpAnchor(hpage, 'bnotes'+(++notesidx))+
			hlpGoAnchor(hpage, 'notes'+notesidx, '[n'+notesidx+']');
	}); 
	data=data.replace(re1,'$1<a href="javascript:window.showHlp(\'$4\');">$2'+aqlC.slink+'</a>'); 
	data=data.replace(re2,'<a href="javascript:window.showHlp(\'$2\');">$1'+aqlC.slink+'</a>'); 
	data=data.replace(/( |>|\n)%(([\[\],\wéèêëàâïôœçùÀÉÈÊË°&:?\(\)\/\-\.:!']+[\t ]*){1,8})%%/g, function (mt, p1, p2) {
		return p1+'<a href="javascript:window.showHlp(\''+p2.replace(/\s+/g,'_')+'\');">'+p2+aqlC.slink+'</a>'}); 
	//--------------------------------------------------------------------------------	
	data=data.replace(/\n/g,'<br>'); // all line feed taken into account 
	data=data.replace(/^[\t ]*(<br>)*/,""); // remove leading spaces and newline (due notably to directives)
	data+="(:clear:)"; // to have the window height adjusting to height.
	data=data.replace(/[\t ]*\(:clear:\)[\t ]*(<br>)*/gm, cleardiv); // clear image
	//== introduction =============================================================
	var npos = data.search (/♦/g);  // Isolate text which is before first title (== title)
	intro = (npos>=0) ? data.substr (0,npos): data;
	data  = (npos>=0) ? data.substr (npos)  : '';	
	ptitle = (notitle)? "":'<h1 role="banner">'+tabHlp[hpage].title+'</h1>'; //???
	intro = '<div class="hlpintro">'+ptitle+intro+'</div>'+((intro)?cleardiv:""); 
		//We  clear intro only if there is text inside - title is always in the intro
	//== Titles and associated blocks, Table of content ===========================
	var axz = tocsection (data, titles, hpage, notoc, numtitle); //data = axz[0];	toc = axz[1];
	data = axz[1]+intro+'<div class="hlpbody">'+axz[0]+'</div>'; 
	//===============================================================
	data = data.replace (/(<br>)*♦(<br>)*/g, '♦'); // clean newlines before/after titles
	data = data.replace (/<br><br><br>/g, '<br><div class="spacer2"></div>'); // not classy, but using <p></p>
	data = data.replace (/<br><br>/g, '<br><div class="spacer1"></div>'); // in a wiki is fairly difficult.
	untoken(titles,'♦');
	if (refs.length && !data.match(/\(:reflist:\)/g))
		data += '<br><strong>Internet links</strong>(:reflist:)'; // if no refs and links, add at page end
	data = addlistref (refs, /\(:reflist:\)/,'xref');	// directive for referenced links
	data = addlistref (notes, /\(:notes:\)/,'notes'); // Directive for notes	
	if (hlpdiag)
		data = data +'<br><small>'+aqlO.loadTime+'  Page interpretation: '+Math.round(hlptimenow()-now)+
			'ms  <a href="javascript:window.showHlp(\'hlptest\');">__</a>  Board: '+hlpSelId+'</small>'; 
	data = data.replace ('<br>♠','♠');
	untoken(tables,'♠');
	untoken(weblinks,'♥');
	untoken(weblinkis,'▼');  	
	data = data.replace(/·/g,'%'); // replace char 250 by % (for URI encoding)	after untoken of weblinks 
	data = data.replace (/(\(:[\w]*([\t ]([\w-]*))?:\)[\t ]*(<br>)?)/g,''); //remove all remaining directives - when doubled
	if (!aqlO.listAll)
		untoken(codeblocks,'▲'); //U+25B2  - Last to not modify directives
	data = data.replace (/<code>\s*(<br>)*/g, '<code>'); // remove leading newlines inside a pre-block
	data = data.replace (/<hr>\s*(<br>)*/g, '<hr>'); // remove leading newlines after a line
	data = data.replace (/(<br>)*<\/code><\/pre>\s*<br>/g, '</code></pre>'); // eliminate one newline before and after </pre>
	if (!nofoot)
		data += z(zo(tabHlp[hlpfoot]).p); //no wiki markup interpretation of the footer nor header
	if (!nohead)
		data = z(zo(tabHlp[hlphead]).p)+data;
	if (myclass) // add global personnal class - around footer and header also ??
		data = '<div class="'+ myclass.trim()+'">'+ data +'</div>'; 
	data += '<br><br><br><br><br><br>'; // bug with taskbar height, so add empty lines	
	//alert (data.replace (/<br>/g, '\n'));
	return data;
}

function tocsection (data, titles, hpage, notoc, numtitle) { // build toc and titles, with sections delimitations
var titlenum="", title, titlenolnk, level,  l1=1, l2=1, l3=1; 
var ttl=[0,0,0], collapsible, clpdisp, icon, lead, clpclass; // collapsible sections
var i,j, toc="";
	if (titles.length) { // shall run to have anchors even if no toc
		var icondown = '<span class="licon h-expand"></span>';
		var iconup   = '<span class="licon h-collapse"></span>';
		for (j=0; j<titles.length ; j++){
			level = Math.min (titles[j].match(/=/g).length,4); //Count '=' for css class definition 
			collapsible = titles[j].match (/^[=]{2,4}([>|<])/);
			clpdisp = collapsible ? ((collapsible[1]=='<')? ' style="display:none" ':'') :'';
			icon    = collapsible ? ((collapsible[1]=='<')? icondown : iconup) :'';
			title = titles[j].replace (/^[=]{2,4}[>|<]?[\t ]*([^=]+?)[\t ]*$/,'$1');
			titlenolnk = title.replace (/(.*)%(.*)%.[^\s]*(.*)/,'$1$2$3'); // get text of a link (and text around) ??
			if (titlenolnk) title = titlenolnk;  // replace text with link
			if (numtitle)
				switch(level) {
					case 2:	titlenum = l1.toString()+'. ';  							l3=1;	l2=1;	l1++; break;
					case 3: titlenum = (l1-1).toString()+'.'+l2.toString()+'. '; 	 			l3=1;	l2++; break;
					case 4: titlenum = (l1-1).toString()+'.'+(l2-1).toString()+'.'+l3.toString()+'. ';	l3++;
				} 
			toc += '<a href="#'+hlpDefAnchor(hpage, title)+'" class="rtoc'+level+'">'+titlenum+title+'</a><br>'; // go to anchor
			lead=""; // nested div management	
			for (i=2; i>level-3; i--)
				if (ttl[i]) {ttl[i]=0; lead+='</div></div>'};
			clpclass = (collapsible) ? ' class="hlptt"': ''; // indicate title can collapse section
			ttl [level-2]= 1; //always have a container over section content - formatting and code simplicity
			titles[j] = lead+'<div>'+hlpAnchor(hpage,title)+'<h'+level+clpclass+' id="'+hpage+j+'">'+ // id used by toggling 
				titlenum+icon+'&nbsp;'+title+'</h'+level+'><div class="hlpsec"'+clpdisp+'>'; //shall be != for menu & main page	
		}
		for (i=0; i<3; i++) // close all sections
			if (ttl[i]) data +='</div></div>';
		toc = (aqlO.listAll||notoc||(!toc)) ?
			"" : '<div class="hlptoc" role="navigation" aria-label="Secondary">'+toc+'</div>';  
	}	
	return [data, toc];
}

function hlpTable (tabmark) {
var i, j, tab="", tabtot=[], row=[], ncol=0, ncol1, val, mt, calign, tdh, alt, cl;	
	function z(val) { return (val||''); } //just make empty strings of undefined
	function chktxt(txt) {
		calign = "";
		tdh = 'td';
		if (txt) {
			var mt = txt.match(/^(=)?(\*)?([\t ]*)(.*?)([\t ]*)$/); 
			if (mt) {
				txt = z(mt[4]);
				tdh = (z(mt[1])=='=')?'th':'td';
				if (z(mt[2])=='*')
					txt = '<strong>'+txt.trim()+'</strong>'; 
				if (z(mt[3])&&!z(mt[5]))
					calign = ' style="text-align:right"';	
				else if (!z(mt[3])&&z(mt[5]))
					calign =' style="text-align:left"';	
				else
					calign =' style="text-align:center"';
				return txt.trim();	
			}
		}
		return "";
	}
	if (tabmark) {
		var tabarr = tabmark.split('\n');
		var nrow = tabarr.length-2; //last line always empty, first line caption
		tab = tabarr[0].replace (/^(([LRC])(\w*?))?((^|[\t ]).*)$/, 
			function (mt, p1,p2,p3,p4){
				p4 = z(p4).trim();
				p4 = (p4)?'<caption>'+p4+'</caption>':"";	
				var cl = z(p2)?((p2=='L')?'left':((p2=='C') ? 'center' : 'right')):'center';
				cl += z(p3)? " "+p3:""; // add personalized class
				return '<table class="'+cl+'">'+ p4;
		});
		for (i=0; i<nrow; i++)	{ // column counter
			tabtot[i] = (tabarr[i+1])?tabarr[i+1].split('::') :[];
			ncol1 = tabtot[i].length;   // if last col empty, not counted 
			ncol = Math.max (ncol, ncol1 - ((z(tabtot[i][ncol1-1]).trim())?0:1));
		}	
		for (i=0; i<nrow; i++)	{
			alt=(i%2)? ' class="tbalt"' : ''; // even rows have 'alt' class
			mt = z(tabarr[i+1]).match (/^::(.*?)(::.*)?$/)
			if (mt) {
				val = chktxt (mt[1]); // set cstrong and tdh
				tab	+= '<tr'+alt+'><'+tdh+' colspan='+ncol+calign+'>'+val+'</'+tdh+'></tr>';
			}
			else {
				mt = tabarr[i+1].match(/^(.*):::(.*?)(::.*)?$/);
				if (mt) {
					val = chktxt (mt[1]);
					tab	+= '<tr'+alt+'><'+tdh+calign+'>'+val+'</'+tdh+'>';
					val = chktxt (mt[2]);
					tab	+= '<'+tdh+' colspan='+(ncol-1)+calign+'>'+val+'</'+tdh+'></tr>';
				}
				else {	// management of empty lines ??
					tab	+= '<tr'+alt+'>';
					row = z(tabtot[i]);
					for (j=0; j<ncol; j++) {
						val = chktxt (row[j]);
						tab	+= '<'+tdh+calign+'>'+val+'</'+tdh+'>';
					}	
					tab	+= '</tr>';
				}	
			}
		}
		tab +='</table>';
		if ((cl||'')=="center") // to be centered, a table shall be in a container
			tab = '<div style="text-align:center;">'+tab+'</div>';
		// alert (tab.replace (/<\/tr>/g,'</tr>\n'));
		return tab;
	}	
}

function hlpSetContent (hpage) {
	var dpage, htext="", n="", idx, len, str,i, xlnk=[];
	idx = (hpage=='hlplast') ? aqlO.lastP : hpage; // if call for last page
	if (idx == 'hlpall') { // all pages in one go - for printing - modify to print any list ?? Integrate with HlpPrint function
		str = z(zo(tabHlp["hlpprtall"]).p); // contains a list of pages to print - pass as parameter (in anchor ?)
		str = str.replace(/[\n\r\s\t]/g,'').toLowerCase(); // also remove directive (for nosearch) ?
		var allHlp = str.split(",");
		for (i=0; i<allHlp.length; i++) {
			if (i)
				htext+="<div class='brk'></div><br>";// add page break at each help page
			dpage = z(zo(tabHlp[allHlp[i]]).p);
			if (dpage) // 'All pages' title is toc page title
				htext+="<div style='page-break-inside: avoid;'>"+hlpTrans(dpage, allHlp[i])+"</div>";
		}
	}
	else { // ordinary pages
		dpage= z(zo(tabHlp[idx]).p);
		if (dpage && dpage.substr(0,2)=='->')  {// forward page
			idx = dpage.match (/^->([\w-]+)/)[1].toLowerCase();
			dpage = z(zo(tabHlp[idx]).p);
		}	
		if (dpage) {
			htext=hlpTrans (dpage, idx); // convert before search word highlighting
			if (aqlO.lastP=='hlpsearch') { // if linked from search page, highlight search on called page 
				var pos=0, j=-1, tabSearch=[];
				//htext = htext.replace (/<a (href|name)=.*?>/g, function (mt) { // tokenize links/anchors
				htext = htext.replace (/<(a h|a na|div|img|\/|table|h|tr|th|td).*?>/g, function (mt) { // tokenize some html markup
					xlnk.push(mt);
					return '♣';
				});
				var lenStr = tabHlp['hlpsearch'].title.length; // title contains the search word
				var dpageNorm = accentsNorm(htext).toLowerCase();
				while (pos != -1) { // index calculated on lowercased page
					pos = dpageNorm.indexOf(tabHlp['hlpsearch'].title, j + 1);
					tabSearch.unshift(pos); // will be inserted at end to maintain index
					j = pos;
				}
				for (j=1; j<tabSearch.length; j++) { // position 0 includes -1
					htext = insertStr(htext,tabSearch[j]+lenStr,"</mark>"); //end markup before first for index
					htext = insertStr(htext,tabSearch[j],"<mark>");
				}
				if (xlnk) //untoken
					for (j=0; j<xlnk.length; j++) 
						htext = htext.replace ('♣',xlnk[j]);
			}
		}
	}
	if (!htext ) { // page not found, so we load table of content
	  	htext = htextnohlp; // ?? error if help not loaded
		htext+= hlpTrans(z(tabHlp['hlptoc'].p), 'hlptoc'); // add table of content
		idx='hlptoc';
	}
	//if (idx=='hlptoc') // If we are in table of content print ALL help ??
	$('#aql_body').html(htext); //replace html content - modify header ?? (hd)
	$("#tthlplbl").html(tabHlp[idx].title); //set title in top banner
	aqlO.lastP = idx;				
	hlpCreEvents(); // We have new html components with events (toggled sections), reloading delete events
	console.log (aqlO.linkbase+'#'+aqlC.prefix+idx);
	if (!arguments[2]) // 2nd argument is statechange
		history.pushState("", "", aqlO.linkbase+'#'+aqlC.prefix+idx);
}

function searchHlp() { // Search a text in all help file
	var page, title, fText, i;
	var tbFound=[], tbFoundTitle=[], idxTb=0, idxTbT=0;
	var stext = tabHlp['hlpsearch'].title; // title used to store search word 
	for (var id in tabHlp) {
		if (tabHlp[id]&&tabHlp[id].search&&(tabHlp[id].p.substr(0,2)!='->') //exclude nosearch, empty and redirect pages
			&& id!='prtall') { // check search flag - set in load all pages
			title = accentsNorm(tabHlp[id].title).toLowerCase(); 
			page  = accentsNorm(tabHlp[id].p).toLowerCase(); //all search in lowercase 
			if (title.indexOf(stext)>-1) // search first in titles
				tbFoundTitle[idxTbT++]=id;
			else if (page.indexOf(stext)>-1)
				tbFound[idxTb++]=id;
		}
	}
	if (idxTbT>0 || idxTb>0 ) {
		fText = "(:notitle:)\n<hr>"+T("<b>{0}</b> found in following pages:", stext)+"<hr>";
		for (i=0; i<idxTbT; i++)
			fText+="%"+tabHlp[tbFoundTitle[i]].title+"%"+tbFoundTitle[i]+'\n';
		fText+="----";
		for (i=0; i<idxTb; i++)
			fText+="%"+tabHlp[tbFound[i]].title+"%"+tbFound[i]+'\n';
	}
	else 
		fText = "----  "+T("<b>{0}</b> was not found", stext)+"\n----";
	return fText; // return a html text with links list
}

function hlpPrint() { // print the body of the help windows - reinterpret with options
	var $printSection = document.getElementById("printSection"); // defined in CSS 
	if (!$printSection) {
		$printSection = document.createElement("div");
		$printSection.id = "printSection";
		document.body.appendChild($printSection);
    }
	var head = hlpTab["hlpprinthead"];
	var page = ((head)?head:'(:notoc:)(:allweb:)')+z(zo(tabHlp[aqlO.lastP]).p);
    $printSection.innerHTML = hlpTrans(page, aqlO.lastP);
	window.print();
};

//-- Loading external pages --------------------------------------------------------------
window.hlpLoadAll= function() { // used for search and disgnostics
	var runFunc = arguments[0]; // function started when loading complete
	hlpLoadAll.refP = []; // store pages referenced as not in hash table (and not already searched)
	hlpLoadAll.Eidx = 0; // index of not in hash table pages
	hlpChklnk(hlpAllIntPages(), ""); 
	hlpLoadExt(runFunc); // load all pages in reference list, add new references as needed
}	

function hlpAllIntPages() { // only pages which are already in memory - for link search
var dpage, lnk, htext="", time = hlptimenow();
	aqlO.listAll = true;
    for (var id in tabHlp) {
		if (id!='hlpsearch' && id!='prtall' && id!='hlptest') { 
			dpage = z(zo(tabHlp[id]).p); //all search in lowercase 
			if (dpage)
				htext+='<hr>'+hlpTrans(dpage, id);
		}
	}
	console.log ('Whole in-memory page process time: '+Math.round(hlptimenow()-time)+' ms');
	aqlO.listAll = false;
	return htext;
}

function hlpLoadExt(runFunc)  {
var lnk;
	if (hlpLoadAll.Eidx==hlpLoadAll.refP.length) 
		window[runFunc]();	
	else { 	// load file one after the other, less trouble than multiple runs
		lnk = hlpLoadAll.refP [hlpLoadAll.Eidx];
		$.ajax(aqlO.url + lnk +'.txt', {  // load help content
			dataType: "text",
			global: false,
			success: function(response) { // callback function while page loaded
				hlpStore (response,lnk);
				if(tabHlp[lnk]) { // page may not be created if empty, not format compliant, etc.
					tabHlp[lnk].ext="(ext)";
					hlpChklnk(hlpTrans(z(tabHlp[lnk].p),lnk), lnk); // add new links of this page		
				}
				hlpLoadAll.Eidx++;
				hlpLoadExt(runFunc); 
			},
			error: function(xhr, status, error) { 
				arrayAdd (aqlO.nFound, lnk);
				hlpLoadAll.Eidx++;
				hlpLoadExt(runFunc); 
			}
		});
	}
}

function hlpChklnk(htext, id) { // stack pages not found in the hash table ( not loaded external or non existing)
	var lnk; // id is just for messages when links have problems
	var ilinks = htext.match (/wHlp\('[^'#]*(?='\))/g); //all internal links - no lookbehind in Javascript regex, so eliminated later
//	var ilinks2 = data.match (/showHlp\('(.*?)(<br>|<a href=)/g); //add what follow the link for contextualisation - broken
	for (var i=0; i < (ilinks||"").length; i++) {
		lnk = ilinks[i].substr(6).split('!',1)[0].toLowerCase(); // eliminate leading and anchor
		if (lnk.length > aqlC.linkMaxLength) {
			if (id) alert (T('Link "{0}" length exceed {1} in page {2}', lnk, aqlC.linkMaxLength, id)); // give some context, please!!
		}	
		else if (!tabHlp[lnk]) //not loaded page added on Ref stack
			if ((aqlO.nFound.indexOf(lnk)<0) && (aqlO.nValid.indexOf(lnk)<0))
				arrayAdd (hlpLoadAll.refP, lnk); // stack link as referenced (if not already referenced)
	}
} 

//== Utilities ===================================================================

function accentsNorm(s) { // found on stackoverflow website
// transform accented letters in plain letters (uppercase AND lowercase) (for search or other purpose)
// for a search, all shall be lowercase (or uppercase). This set is for most latin language.
// DO NOT merge typographic ligatures or expand characters as it changes the word position index
    var map = [
        //["\\s", ""],  We left spaces in place as they are counted in index - for highlighting
        ["[àáâãäå]", "a"],
        //["æ", "ae"], // NOT changing ligatures
        ["ç", "c"],
        ["[èéêë]", "e"],
        ["[ìíîï]", "i"],
        ["ñ", "n"],
        ["[òóôõö]", "o"],
        //["œ", "oe"],
        ["[ùúûü]", "u"],
        ["[ýÿ]", "y"],
		["¿", "?"],
		["¡", "!"],
		["[ýÿ]", "y"],
        ["[\-:]"," "],
        //["\\W", ""] We left special char in place, as they are counted in index
    ];
    for (var i=0; i<map.length; ++i) {
        s = s.replace(new RegExp(map[i][0], "gi"), function(match) {
            if (match.toUpperCase() === match) {
                return map[i][1].toUpperCase();
            } else {
                return map[i][1];
            }
        });
    }
    return s;
}

function insertStr (source, index, string) {// insertion of a string within another - index CAN BE undef
    return (index) ? source.substr(0, index) + string + source.substr(index) : source;
}
function arrayAdd (arr, val) {  // add only if not existing
	if (arr.indexOf(val)==-1) arr.push(val);
}
	
//== Writer tools == from this line to the end, can be removed on user program ===================
function hlpList() { // list all pages on current window - called by hlpLoadAll
var i, tabTrans = {};	
	aqlO.listAll = true; // unactivate toc and pre block
	var text = '<div style="margin:12px;"><strong>Internal & External pages with backlinks (referers) and link quantity per backlink</strong><br>';
	for (id in tabHlp)  // create hash table of converted markup
		tabTrans[id] = (tabHlp[id]) ? hlpTrans(z(tabHlp[id].p), id):"";
	for (lnk in tabHlp)  // tabHlp is a hash table, so 'in' works
		text += backlinks(tabTrans,lnk); //lnk +'<br>';
	text+='<hr><strong>Not found pages:</strong><br>'
	for (i=0; i < aqlO.nFound.length; i++) //for..of may work, but compatibility is delicate
		text += backlinks(tabTrans, aqlO.nFound[i]);
	text+='<hr><strong>Not valid pages:</strong><br>'	
    for (i=0; i < aqlO.nValid.length; i++) 
		text += backlinks(tabTrans, aqlO.nValid[i]);
	text+='</div><br><br><br><br><br><br>';	
	$('#aql_body').html(text); 
	aqlO.listAll = false; // re-allow normal interpretation
}	

function backlinks(tabH, link) {
var backlnk, i, hpage, nblink, text;
    text = '<strong>'+z(zo(tabHlp[link]).ext)+link+' :</strong>';	
	for (id in tabHlp) {
		hpage = tabH[id];
		if (hpage) {
			nblink=0;
			var ilinks = hpage.match (/wHlp\('[^'#]*(?='\))/g); //all internal links 
			for (i=0; i < z(ilinks).length; i++) {
				backlnk = ilinks[i].substr(6).toLowerCase(); // eliminate leading chars
				if (backlnk==link) {
					if (!nblink) 
						text+=id+'(';
					nblink++;  // count number of links in same page
				}	
			} 
			if (nblink)	
				text+=nblink+'), ';
		}	
	}	
	return (text +'<br>');
}

function hlpAllWeblnk() { // list all links for all pages - DO NOT search identical links
var count=0, text="", page, m, re=/(<a href="htt.*?<\/a>)/g;	
	for (id in tabHlp) { 
		text+="<br>Page:"+id+":<br>";
		page = hlpTrans(z(tabHlp[id].p), id);
		while (m=re.exec(page)) { 
			if (!m[0].match(aqlC.excluAllWeb)) { //exclude aquilegia link
				text+=" * "+m[0]+'<br>';
				count++;
			}	
		}	
	}
	text = "<strong>There is "+count+" external links<strong><br>"+text; 
	$('#aql_body').html(text); 
} 

function hlpAllImglnk() { // check image links
var count=0, page, m, re = /<img class=.+?src="(.*?)"/g;	
var re2 = /href="([^"]*?\.([pP][nN][gG]|[jJ][pP][gG]|[sS][vV][gG]))"/g; //No external images
	$('#aql_body').html('<br><strong>Images not found: </strong><br><br>'); 
	for (id in tabHlp) { 
		page = hlpTrans(z(tabHlp[id].p), id);
		while (m=re.exec(page)) 	hlpcheckImg(m[1], id);
		while (m=re2.exec(page)) 	hlpcheckImg(m[1], id);
	}
} 

function hlpcheckImg(url, id) {
	var img = new Image(), msg;
	if (url.length > (aqlC.linkMaxLength+aqlC.dir.length)) {
		msg = T('Link "{0}" length {1} exceed {2} in page {3} <br>',url,url.length,(aqlC.linkMaxLength+aqlC.dir.length), id);
		$('#aql_body').append(msg);
	}	
/*	if (url!=url.toLowerCase()) // ok, too many warnings, we shall change 
		alert (T('Image or document name {0} shall be lowercase in page {1}', url, id)); */		
	img.id = id+'_'+img.unique_ID;
	img.onerror = function() { // store image name in id to recover when function end task
		var txt = 'Page :'+this.id.split('_')[0]+'<br>'+this.src+' not found <br><br>';
		$('#aql_body').append(txt); 
	}
	img.src = url;
}
