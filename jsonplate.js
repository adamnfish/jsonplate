/*
 *	jsonplate.js
 *	Mootools class to output a JSON template as html
 *	This was designed to be used in a server-side environemt with mootools
 *	
 *	@description: Mootools class to create (x)html from a JSON object in the jsonplate syntax
 *	@author: Adam Fisher (adamnfish)
 *	@version: 0.1 (alpha)
 *	@licence: MIT-Style
 *	@website: http://www.adamnfish.com/projects/jsonplate/
 *	@github: http://github.com/adamnfish/jsonplate/tree
 *	@requires: Mootools 1.2.3+
 */

/*
 *	String method for robust repetition - used for formatted output of the markup
 */
String.prototype.repeat = function(times){
	var str = "";
	times = $pick(times, 2);
	for(var i = 0; i < times; i++){
		str += this;
	}
	return str;
};

var Jsonplate = new Class({
	json: {},
	content: "",
	contentArr: [],
	generated: false,
	level: 0,
	checkboxPrefixHack: false,
	checkboxPrefixHackCache: $H({}),
	
	emptyTags: ['br', 'img', 'input', 'hr', 'link', 'meta'],
	textOnlyTags: ['text', 'html', 'textnode'],
	
	initialize: function(json){
		this.setJSON(json);
	},
	
	// public methods
	output: function(silent, pretty){
		silent = silent === undefined ? false : silent;
		pretty = pretty === undefined ? true : pretty;
		
		if(!this.generated){
			this.generate(pretty);
		}
		
		if(silent === true){
			// return as a string
			return this.content;
		} else {
			print(this.content);
			return this.content;
		}
	},

	getJSON: function(){
		return this.json;
	},
	
	setJSON: function(json){
		this.generated = false;
		this.json = $splat(json);
	},
	
	// internal methods
	generate: function(pretty){
		// turns json into an html string;
		this.printChildnodes(this.json, pretty);
		
		this.content = this.contentArr.join("");
		this.checkboxPrefixHackCache.empty();
		
		this.generated = true;
	},
	
	printTag: function(node, tagname, firstChild, lastChild, pretty){
		this.level++;
		
		// do the checkbox hack here
		if(this.checkboxPrefixHack && "input" === tagname && "checkbox" === node.type){
			// if we have a checkbox input and the setting is enabled for this class instance
			var name = node.name;
			if(!this.checkboxPrefixHackCache.get(name)){
				this.level--;
				this.printTag({
					type: "hidden",
					value: "",
					name: name,
					"class": "checkbox-ignore"
				}, "input", firstChild, lastChild, pretty);
				firstChild = false;
				this.checkboxPrefixHackCache.set(name, true);
				this.level++;
			}
		}
		
		if("null" === tagname){
			// do nothing for a null node
			// it's a way to set "nothing"
		} else if(this.textOnlyTags.contains(tagname)){
			this.contentArr.push($pick(node, ""));
		} else {
			var cnodes = false;
			node = $H(node);
			if(pretty){
				if(firstChild){
					this.contentArr.push("\n");
				}
				this.contentArr.push("\t".repeat(this.level));
			}
			this.contentArr.push("<" + tagname);
			node.each(function(value, attr){
				if("childnodes" === attr){
					cnodes = value;
				} else if("null" == value){
					// do nothing
					// this means we also won't want to print the attr name - ie null stops this attr apearing at all
				} else {
					value = $pick(value, "") + "";
					var match = value.match(/(["])|(['])/);
					var quote = (match ? match[1] : false) ? "'" : '"';
					this.contentArr.push(' ' + attr + '=' + quote + $pick(value, "") + quote);
				}
			}, this);
			
			if(this.emptyTags.contains(tagname)){
				this.contentArr.push(" />");
				if(pretty){
					this.contentArr.push("\n");
					if(lastChild)
					{
						this.contentArr.push("\t".repeat(this.level - 1));
					}
				}
			} else{
				this.contentArr.push(">");
				if(cnodes){
					this.printChildnodes(cnodes, pretty);	
				}
				this.contentArr.push("</" + tagname + ">");
				if(pretty){
					this.contentArr.push("\n");
					if(lastChild)
					{
						this.contentArr.push("\t".repeat(this.level - 1));
					}
				}
			}
		}
		this.level--;
	},
	printChildnodes: function(cnodes, pretty){
		var last = cnodes.length - 1;
		cnodes.each(function(node, i){
			for(var tagname in node){
				if(node.hasOwnProperty(tagname)){
					this.printTag(node[tagname], tagname, (i === 0), (i === last), pretty);
					break;
				}
			}

		}, this);
	}
});