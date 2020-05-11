define(function(require) {
	
	var js = require("js");
	var locale_base = "locales/";

	/*- Locale (computer software), a set of parameters that defines the user's language, region and any special variant preferences that the user wants to see in their user interface. Usually a locale identifier consists of at least a language identifier and a region identifier. -- https://en.wikipedia.org/wiki/Locale
	*/
	/*- TODO
	
		require("locale!du-NL");
		var locale = require("locale");
		locale.set("du-NL");
	*/

	function locale(id) {
    	var loc = locale.loc;//arguments.callee.loc;
    	
    	if(id === undefined || locale[loc] === undefined) {
    		return "{{" + id + "}}";
    	}
    	
    	if(id instanceof RegExp) {
    		var m = [], match;
    		for(var k in locale[loc]) {
    			if((match = id.exec(k)) !== null && match.length > 0) {
    				if(m.indexOf(match[0]) === -1) {
    					m.push(match[0]);
    				}
    			}
    		}
    		return m;
    	}
    	
    	if(locale.slashDotRepl === true) {
    		id = id.replace(/\/\./g, "#");
    	}

    	function resolve(id) {
    		if(id === undefined) debugger;
    		/*- Find in the dictionary */
	    	var r = window.locale[loc][id], i, nid, dash = id.indexOf("-") !== -1;
	    	if(r === undefined && dash === true) {
				/*- Not found, insert star and try again become a star and try again 
					eg. Project-customer.title --> *-customer.title */
				i = 0, nid = id.split("-");
				while(nid[i] === "*" && i < nid.length - 1) {
					i++;
				}
				if(i < nid.length && nid[i] !== "*") {
					nid[i] = "*";
					r = resolve(nid.join("-"));
				}
	    	}
			if(r === undefined && id.indexOf(".") !== -1) {
				if(dash === true) {
					/*- Not found, let last part fall off and try again 
						eg. Project-customer.title --> Project-customer */
					nid = id.split("."); nid.pop();
					r = resolve(nid.join("."));
				} else {
					/*- Not found, insert star and try again become a star and try again 
						eg. Project-customer.title --> *-customer.title */
					i = 0, nid = id.split(".");
					while(nid[i] === "*" && i < nid.length - 1) {
						i++;
					}
					if(i < nid.length && nid[i] !== "*") {
						nid[i] = "*";
						r = resolve(nid.join("."));
					}
					if(r === undefined) {
						nid = id.split("."); nid.pop();
						r = resolve(nid.join("."));
					}
				}
			}
			/*- TODO Still not found, split by / delimiter and 
				replace by star and try again */
			return r;
    	}
    	
    	var r = resolve(id);
		if(r === undefined) {
    		var arr = (window.locale.missing = (window.locale.missing || []));
    		arr.push(id);
        	// console.warn("undefined locale: " + id);
        	r = "{" + id + "}";
		}
		
		if(typeof r === "function" && arguments.length > 1) {
			var args = js.copy_args(arguments);
			args.shift();
			r = r.apply(this, args);
		}
		
    	return r;
	}

	/* What to do with this? */
    locale.instancesOf = function(entity, options) {
    	options = (options && js.str2obj(options)) || {};
    	
    	var r = locale(new RegExp(entity + "#[a-z|A-Z|0-9|_|-][a-z|A-Z|0-9|_|-]*"))
    		.map(function(s) {
	    		var key = s.split("#")[1];
	    		return {entity: entity, key: key, value: locale(s)};
	    	});
	    	
	    if(options['sort-order'] === "key desc") {
	    	r = r.sort(function(i1,i2) { 
	    		return parseInt(i2.key, 10) < parseInt(i1.key, 10) ? -1 : 1;
	    	});
	    }
	    	
	    return r;
    };
    locale.prefixed = function(prefix) {
    	return function(id) {
    		return locale(prefix + id);
    	};
    };
    
	if(typeof window !== "undefined" && typeof window.location !== "undefined") {
		locale.loc = (location.search.split('locale=')[1]||'').split('&')[0];
		// locale.loc = locale.loc || localStorage.locale;
		locale.loc = locale.loc || document.documentElement.locale;
		locale.loc = locale.loc || document.documentElement.lang;
		locale.loc = locale.loc || "nl";
		if(window.hasOwnProperty("locale_base")) {
			locale_base = window.locale_base;
		}
		window.locale = locale;
	}

	return {
		locale: locale,
		module: function(module) {
			return function() {
				var args = js.copy_args(arguments);
				args[0] = module.id + String(args[0]);
				return window.locale.apply(this, args);
			};
		},
        load: function (name, req, onLoad, config) {
        	if(name.split("/").length === 1) {
        		name = locale_base + name;	
        	} else {
        		// name = name.substring(1);
        	}
        	
        	req([js.up(name) + "/prototype", name], function(proto, dict) {
        		// group to language (nl_NL/en_UK/en_US/etc)
        		name = name.split("/").pop();
        		locale[name] = locale[name] || {};
        		js.mixIn(locale[name], js.mixIn(js.obj2kvp(proto || {}) ,js.obj2kvp(dict)));
        		onLoad(dict);
        	});
        }
	};
});