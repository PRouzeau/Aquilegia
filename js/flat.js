
// From model.js of DWC (Chrishamm)
// Translation function
function T(text) {
	var entry = text;
	/*
	if (translationData != undefined) {
		// Generate a regex to check with
		text = text.replace(/{(\d+)}/g, "{\\d+}").replace("(", "\\(").replace(")", "\\)");
		text = text.replace("?", "[?]").replace(".", "[.]");
		var regex = new RegExp("^" + text + "$");

		// Get the translation node and see if we can find an entry
		var root = translationData.getElementsByTagName(settings.language).item(settings.language);
		if (root != null) {
			for(var i=0; i<root.children.length; i++) {
				if (regex.test(root.children[i].attributes["t"].value)) {
					entry = root.children[i].textContent;
					break;
				}
			}

			// Log translation text if we couldn't find a suitable text
			if (translationWarning && entry == text) {
				console.log("WARNING: Could not translate '" + entry + "'");
			}
		}
	}
*/
	// Format it with the given arguments
	var args = arguments;
	return entry.replace(/{(\d+)}/g, function(match, number) {
		number = parseInt(number) + 1;
		return typeof args[number] != 'undefined' ? args[number] : match;
	});
}

// Variable use for text selection - on the board, it gives the board type ('Duet 0.6' or 'Duet 0.85')
var boardResponse="";
