//(c)  PRZ 2016   GPLv2 or any later version
// Conversion from wikimedia markup to Aquilegia markup (limited)
// This is an implementation made to transfer the files from RepRap.org, however it can be used as a frame for another site.
//If you already decided the page name on your documentation set, it will be quite helpful to set the whole site links by defining the knownpages data.
//accents are for french, so you may add other letters in the regex if using a language with accented letters.

window.startx = function() {
   document.getElementById('btn-save').onclick=readFile;
}

function readFile() {
	sourcefname = document.getElementById('input-fileName').value;
	sourcefname = sourcefname.replace (/(.*?)(\.txt)?/, "$1");
	//alert ("fname: "+sourcefname);
	convertwiki(sourcefname);
}

function knownpages (data, text, page) {
	text2 = text.replace(/ /g, '\\s'); 
	text2 = text.replace(/_/g, '\\s'); 
	exch = new RegExp('\\[\\['+text2+'\\]\\]','g');
	data = data.replace(exch, '%'+text+'%'+page);
	exch2 = new RegExp('\\[\\['+text2+'\\s*\\|\\s*([\wéèêëàâïôœçùÀÉÊ\\s]+)\\]\\]','g');
	return data.replace(exch2, '%$1%'+page);
}

function convertwiki(source) {
	var Url = source+'.txt'; // source file	
	var data = loadUrl(Url);
	data=data.replace(/\r\n?/g,'\n'); // cr/LF and other stuff
	data=data.replace(/\[\s*(.+?)\s*\]/g,'[$1]'); // trim space between brackets

	data = knownpages (data, "RepRap Firmware G-Codes", "G-codes");
	data = knownpages (data, "RepRap Firmware FAQ", "FAQ");
	data = knownpages (data, "RepRap Firmware macros", "Macros");
	data = knownpages (data, "Updating RepRap Firmware config.g file", "Updating_config.g");
	data = knownpages (data, "RepRap Firmware release notes", "Release_notes");
	data = knownpages (data, "RepRap Firmware heating","Heating");
	data = knownpages (data, "RepRap Firmware commissioning","Commissioning");
	data = knownpages (data, "RepRap_Firmware_Status_responses","Status_responses");
	data = knownpages (data, "Using_PT100_temperature_sensors_with_the_Duet_and_RepRapFirmware","Using_PT100");
	data = knownpages (data, "Using_thermocouples_with_the_Duet_and_RepRapFirmware","Using_thermocouples");
	
	data = knownpages (data, "Duet","Duet");
	data = knownpages (data, "Duet fans","Fans");
	data = knownpages (data, "RepRapFirmware", "RepRap_Firmware");
	data = knownpages (data, "RepRap Firmware", "RepRap_Firmware");
	data = knownpages (data, "Duet pinout", "Duet_pinout");
	data = knownpages (data, "Duet Wiring", "Duet_wiring");
	data = knownpages (data, "Duet Firmware Update", "Duet_firmware_Update");
	data = knownpages (data, "Duet design", "Duet_design");
	data = knownpages (data, "Duet Web Control", "Duet_Web_Control");

	data=data.replace(/\s*====\s*\n/g, '\n');
	data=data.replace(/\s*===\s*\n/g, '\n');
	data=data.replace(/\s*==\s*\n/g, '\n');
	data=data.replace(/{{dl}}/g, ''); // specific of RepRap wiki  - double licensing 
	data=data.replace(/<br>/g, '\n'); // Aquilegia respect newlines
	data=data.replace(/{{[Cc]lr((\|left)|(\|right))?}}/g,'(:clear:)'); 
	data=data.replace(/<ref>(.*?)<\/ref>/g,'"# $1"');  // or create a ref list - but how to manage it page by page ?
	data=data.replace(/{{Reflist}}/g,'(:reflist:)<br>(:notes:)');
	data=data.replace(/\[\[[Cc]ategory:([\#\.\:\-\_a-zA-Z0-9éèêëàâïôœçùÀÉÊ\s]+?)\]\]/g, '(:category $1:)'); // Category not used in Aquilegia - just for future
	//data=data.replace(/\[\[[Ff]ile:([\#\.\:\-\_\(\)_a-zA-Z0-9éèêëàâïôœçùÀÉÊ\s]+.)(png|jpg|svg|JPG|PNG|SVG)[\#\.\:\-\_\(\)a-zA-Z0-9éèêëàâïôœçùÀÉÊ\|\s]+\]\]/g, '320%$1$2'); // image
//	var reimg =/\[\[[Ff]ile:([\#\.\,\:\-\_\(\)\wéèêëàâïôœçùÀÉÊ\s]+.)([pP][nN][gG]|[jJ][pP][gG]|[sS][vV][gG])[\#\.\:\-\_\(\)\w\,\-\.\#\:éèêëàâïôœçùÀÉÊ\|\s]+\]\]/g;
	var reimg =/\[\[[Ff]ile:([\#\.\,\:\-\_\(\)\wéèêëàâïôœçùÀÉÊ\s]+.)([pP][nN][gG]|[jJ][pP][gG]|[sS][vV][gG]).*?(\|(\d*)px.*?)?\]\]/g;
	data=data.replace(reimg, function(m, p1,p2,p3,p4){
		p4 = (p4)?p4:"320";
		return p4+"%"+(p1||"")+(p2||"");
	}); // image
	/*
	data=data.replace(/\[\[([\#\.\:\-\_\(\)_a-zA-Z0-9éèêëàâïôœçùÀÉÊ\s]+)\|([\#\.\:\-\_\(\)0-9_a-zA-Z0-9éèêëàâïôœçùÀÉÊ#:\s]+)\]\]/g, '%$2%$1'); // link
	data=data.replace(/\[\[([\#\.\:\-\_a-zA-Z0-9éèêëàâïôœçùÀÉÊ\s]+)\]\]/g,'%$1%$1'); // link
	data=data.replace(/\[(http(s?)\:\/\/([\da-z\.-]+)\.([a-z\.]{1,6})[\S]*)\s([0-9.,;\(\)_\\\/\w\s]+)\]/g, '%$5%$1'); // web link
	*/
	//var lnkRegexp = /\[\[([&\#\.\:\-\_\(\)_a-zA-Z0-9éèêëàâïôœçùÀÉÊ\s]+)\|\s*([&\#\.\:\-\_\(\)0-9_a-zA-Z0-9éèêëàâïôœçùÀÉÊ#:\s]+)\]\]/g;
	var lnkRegexp = /\[\[([&\#\.\:\-\_\(\)_a-zA-Z0-9éèêëàâïôœçùÀÉÊ\s]+)\|\s*([&\#\.\:\-\_\(\)0-9_a-zA-Z0-9éèêëàâïôœçùÀÉÊ#:\s]+)\s*\]\]/g;
	data=data.replace(lnkRegexp, '%$2%◄$1►'); // link with text
	// var lnkRegexp2 = /\[\[([\#\.\:\-\_a-zA-Z0-9éèêëàâïôœçùÀÉÊ\s]+)\]\]/g;
	var lnkRegexp2 = /\[\[([\#\.\:\-\wéèêëàâïôœçùÀÉÊ\s]+)\s*\]\]/g;
	data=data.replace(lnkRegexp2,'%$1◄%$1►'); // link self text
	data=data.replace(/\[(http(s?)\:\/\/([\da-z\.-]+)\.([a-z\.]{1,6})[\S]*)\s([0-9\.:\?,;\(\)_\\\/\w\s]+)\]/g, '"$5 $1"'); // web link
	data=data.replace(/<pre>(([^>]|=[^<])*)<\/pre>/g,'<<$1>>'); // preformatted 
		
	var intlinks = data.match(/◄(([^◄]|►[^►])*)►/g); 
	data=data.replace(/◄(([^◄]|►[^►])*)►/g, '♣'); 
	if (intlinks) // replace space in internal links by underscores
		for (var j=0; j<intlinks.length ; j++){
			rp = intlinks[j].replace (/\s(?=\w)/g,'_');
			rp = rp.replace (/◄/g,'');
		//	rp = rp.replace (/\s►/g,'');
			rp = rp.replace (/►/g,'');
			data =data.replace ('♣', rp); // replace one time per loop	 
		} 
//	data=data.replace(/_\n/gm,'\n'); //	mmm the last underscore shall not be there first
//	data=data.replace(/_\s/g,'\s');

    data=data.replace(/%G-code\//g,"%http://reprap.org/wiki/G-code/");
	data=data.replace(/%G_code\//g,"%http://reprap.org/wiki/G-code/");
	alert(data);
	saveOnDisk(data, source+"_cvt.txt");
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
			alert (T("Your browser does not allow file loading from server"));
			return "";
		}
	}
	else {
		return "";
	}
}