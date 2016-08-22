//(c)  Pierre ROUZEAU May-August 2016   GPLv2 or any later version
// Conversion from wikimedia markup to Aquilegia markup (limited)
// This is an implementation made to transfer the files from RepRap.org, however it can be used as a frame for another site.
//If you already decided the page name on your documentation set, it will be quite helpful to set the whole site links by defining the knownpages data.
var known =[ // First word of  array is page name in the source wiki, second word is page name in destination
["G-code", "gcode_cvt"], // remember last pair shall not be followed by a comma
["G_code", "gcode_cvt"],
["RepRap Firmware G-Codes", "G-codes"],
["G-code", "G-codes"],
["RepRap Firmware FAQ", "FAQ"],
["RepRap Firmware macros", "Macros"],
["Updating RepRap Firmware config.g file", "Updating_config.g"],
["RepRap Firmware release notes", "Release_notes"],
["RepRap Firmware heating","Heating"],
["RepRap Firmware commissioning","Commissioning"],
["RepRap_Firmware_Status_responses","Status_responses"],
["Proposed_RepRap_Duet_Status_Responses","Status_responses"],
["Using_PT100_temperature_sensors_with_the_Duet_and_RepRapFirmware","Connecting_PT100"],
["Using_thermocouples_with_the_Duet_and_RepRapFirmware","Connecting_thermocouples"],
["Configuring_and_calibrating_a_delta_printer_using_the_dc42_fork_of_RepRapFirmware","Delta_config"],
["Configuring_RepRapFirmware_for_a_CoreXY_printer","CoreXY_config"],
["Configuring_RepRapFirmware_for_a_Cartesian_printer","Cartesian_config"],
["Duet","Duet"],
["Duet fans","Fans"],
["RepRapFirmware", "RepRap_Firmware"],
["RepRap Firmware", "RepRap_Firmware"],
["Duet pinout", "Duet_pinout"],
["Duet Wiring", "Duet_wiring"],
["Duet Firmware Update", "Duet_firmware_Update"],
["Duet design", "Duet_design"],
["Duet Web Control", "Duet_Web_Control"]
];

function hlpmodif (data) { // use this function to make a transformation to an existing 'hlp.txt' file -  Name is recognised
	data=data.replace(/\r\n?/g,'\n'); // cr/LF and other stuff
	data=data.replace(/"(.+?)\s*http:\/\/reprap\.org\/wiki\/G-code#(.+?)"/g, function (mt,p1,p2) {
		return 	"%"+p1+"%gcode_cvt!"+linknorm (p2);
	}); 
	data=data.replace(/"\s*http:\/\/reprap\.org\/wiki\/G-code#(.+?)"/g, function (mt,p1) {
		return "%"+p1+"%gcode_cvt!"+linknorm (p1);
	}); 
	return data;
}

window.panelcvt = function() {
	var texta = document.myform.panelsrc.value.replace("&amp;","&");
	var pan = document.getElementById('panelcvt');
	pan.innerHTML = cvt(texta,"");
	panelsel(pan);
}

window.panelsel = function() {
	pan = arguments[0];
	var range = document.createRange();
    range.selectNode(pan);
    window.getSelection().addRange(range);
}

window.startx = function() {
   document.getElementById('btn-save').onclick=readFile;
}

function readFile() {
	sourcefname = document.getElementById('input-fileName').value;
	sourcefname = sourcefname.replace (/(.*?)(\.txt)?/, "$1");
	//alert ("fname: "+sourcefname);
	convertwiki(sourcefname);
}

function linknorm (p2) {
	return p2.replace (/\./g,".2e")
			.replace (/:/g,".3a")
			.replace (/\//g,".2f")
			.replace (/\?/g,".3f")
			.replace (/"/g,".22");
}

function knownpages (data, text, page) {
	text2 = text.replace(/ /g, '_'); 
	exch2 = new RegExp('\\[\\['+text2+'(#([^\\[\\n]+?))?\\|([^\\[\\n]+?)\\]\\]','g');
	return data.replace(exch2, function (mt,p1,p2,p3) {
		var px = (p2) ? '!'+linknorm (p2): "";
		return '%'+p3+'%'+page+px;
	});
}

function convertwiki(source) {
	var Url = source+'.txt'; // source file	
	var data = loadUrl(Url);
	if (source=="hlp") 	
		data = hlpmodif(data);
	else 
		data = cvt (data, source);
	alert(data);
	saveOnDisk(data, source+"_cvt.txt");
}

function cvt (data, source) {
	data=data.replace(/\r\n?/g,'\n'); // cr/LF and other stuff
	data=data.replace(/\[\s*(.+?)\s*\]/g,'[$1]'); // trim space between brackets
	data=data.replace(/\[\[[Cc]ategory:([\#\.\:\-\_a-zA-Z0-9\u00C0-\u017F\s]+?)\]\]/g, function (mt, p1) {
		p1 = p1.trim().replace(/ /g,"_"); 
		return '(:category '+p1+':)';
	}); // Category not used in Aquilegia - just for future
	data=data.replace(/\[\[([^\[\n]+?)\s*\|\s*(.+?)\]\]/g, function (mt,p1,p2) {
		p1 = p1.trim().replace (/[\t ]/g, "_");
		return ' [['+p1+"|"+p2.trim()+']] ';
	}); 
	data=data.replace(/\[\[([^\|\[\n]+?)\]\]/g, function (mt,p1) {
		var px = p1.trim().replace (/[\t ]/g, "_");
		return ' [['+px+"|"+p1.trim()+']] ';
	}); 
	data = data.replace (/<nowiki>/g,"<<")
			.replace (/<\/nowiki>/g,">>")
			.replace(/\s*={1,5}\s*\n/g, '\n')
			.replace (/'''(.*?)'''/g," **$1**")
			.replace (/%3A\/\//g,"%3A&sol;&sol;");
	data = data.replace(/{\| class="wikitable"([\s\S]+?\|})/g, function (mt,p1) {
		return p1.replace (/\n\|}/g," ::\n:/") // end
			.replace (/\n/,"/:\n")	// First	
			.replace (/\n\|(-\n\|)?/,"\n")
			.replace (/\n\|-\n\|/g," ::\n")
			.replace (/\n\|/g," :: ")
			.replace (/\|\|/g," :: ");
	}); 
	//console.log (data);		
	for (var i=0; i<known.length; i++)
		data = knownpages (data, known[i][0], known[i][1]);
	if (source=="gcode") // specific treatment for this page
		data=filtergcode(data);
	data=data.replace(/{{dl}}/g, '') // specific of RepRap wiki  - double licensing 
			.replace(/<br>/g, '\n') // Aquilegia respect newlines
			.replace(/{{[Cc]lr((\|left)|(\|right))?}}/g,'(:clear:)') 
			.replace(/<ref>(.*?)<\/ref>/g,'"# $1"')  // or create a ref list - but how to manage it page by page ?
			.replace(/{{Reflist}}/g,'(:reflist:)<br>(:notes:)');
	var reimg =/\[\[[Ff]ile:([\#\.\,\:\-\_\(\)\w\u00C0-\u017F\s]+\.)([pP][nN][gG]|[jJ][pP][gG]|[sS][vV][gG]).*?(\|(\d*)px.*?)?\]\]/g;
	data=data.replace(reimg, function(m, p1,p2,p3,p4){
		p4 = (p4)?p4:"320";
		return p4+"%"+(p1||"")+(p2||"");
	}); // image
	var lnkRegexp = /\[\[(.+?)\s*\|\s*(.+?)\]\]/g;
	data=data.replace(lnkRegexp, '"$2 http://reprap.org/wiki/$1"'); // link with text
	var lnkRegexp2 = /\[\[(.+?)\]\]/g;
	data=data.replace(lnkRegexp2,'"$1 http://reprap.org/wiki/$1"'); // link self text
	data=data.replace(/\[(http(s?)\:\/\/([\w\.-]+)\.([\w\.]{1,6})[\S]*)\s((.*?))\]/g, '"$5 $1"'); // web link
	data=data.replace(/<pre>(([^>]|=[^<])*)<\/pre>/g,'<<$1>>'); // preformatted 
	data=data.replace(/{{.+?}}/g,''); //eliminate remaining directives - don't work with nested directives	
	return data;
}

function filtergcode(data) {
	var res = 'gcode_cvt\nG-codes by order\n(:nonum:)\nThis G-codes ordered list is a direct extract from "RepRap Wiki G-code page http://reprap.org/wiki/G-code" and some details may apply only for other firmware than %RepRap Firmware%%.\nSee also %G-codes sorted by themes%G-codes.' 
	var i, j, dta, rmv, msg, tmsg, dtsub=[];
	data = data.replace (/\n====([^=])/g,"\n==$1");
	var datatab = data.split ("\n=="); // set all para at same level (main will be eliminated)
	for (i=1; i< datatab.length; i++) {
		dta = datatab[i].trim();
		tmsg = dta.match(/reprapfirmware=[ ]?{{(.*?)}}/);
		if (tmsg) 
			msg = tmsg[1].trim().toLowerCase();
		else
			msg="";
		rmv = msg.indexOf("see"); 
		msg = msg.replace (/\|/,"; ");
		if (dta.substr(0,4) == "M208") rmv=-1;
		if (dta.substr(0,4) == "M560") 
			dta = dta.replace ("<!","&lt;!"); 
		if (msg && msg!="no" && rmv==-1) {
			dta = dta.replace (/\n*{{[\S\s]*}}\n*/g,"\n");
			dtsub = dta.split ("\n=====");
			dta = "";
			for (j=0; j < dtsub.length; j++) {
				dts = dtsub[j].toLowerCase().split("\n",1)[0]; // title of sub-para
				if (dts.indexOf("teacup")==-1 && dts.indexOf("repetier")==-1 && dts.indexOf("makerbot")==-1)
					dta += (j>0?"===":"")+dtsub[j]+"\n";
			}	
			dtsub = dta.split ("\n");
			dta = "";
			for (j=0; j < dtsub.length; j++) {
				if (j==1 && msg!="yes")
					dta+= "**RepRap Firmware:** "+msg+"\n\n"
				if (dtsub[j][0]==";")
					dta += "**"+dtsub[j].substr(1)+"**\n";
				else
					dta += dtsub[j]+"\n";
			}
			res += "\n=="+dta;
		}
	}
	res = res+'\n\n<small>Licence GFDL 1.2 - source "RepRap Wiki G-code page http://reprap.org/wiki/G-code"</small>'
	return res;
}

function saveOnDisk(data, filename){
    var blob=new Blob([data],{type:"text/plain"});//pass useful mime
    saveAs(blob, filename);
}

function loadUrl(url) {
	var http=null;
	if (window.XMLHttpRequest) { // Test XMLHttpRequest useful for ie ?? Remove for ie 10 and later ?
		//Solution: modify logic, do a chain and pass function as parameter -- uh?
		try {
			http = new XMLHttpRequest();
		} 
		catch (ex) {
			http = new window.ActiveXObject("Microsoft.XMLHTTP");
		}
		http.open( "GET", url, false ); //wait for the page - warning, may lock the interface ??
		http.send(null);
		if (http.readyState==4 && http.status==200)	{
			return http.responseText;
		}
		else {
			alert ("Your browser does not allow file loading from server");
			return "";
		}
	}
	else {
		return "";
	}
}