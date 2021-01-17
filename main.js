// 
// MaxPatch to Pd Converter
// written by Timo Hoogland, 2020
// 
// MIT License
// 

const fs = require('fs-extra');
const path = require('path');

const patchTemplate = require('./data/maxpat.json');

const parser = {
	// Pd -> Max Processor
	'obj' : (args) => {
		console.log('@obj', args);
		let obj = { 
			'maxclass' : 'newobj',
			'text' : args.slice(2, args.length).join(" ") };
		// if (args.length > 4){
		// 	console.log('args', args.length, args);
		// 	obj['position'] = [ ...args.slice(0, 2), 120.0, 22.0 ]
		// }
		// console.log('@obj', obj);
		return obj;
	},
	'text' : (args) => {
		return { 
			'maxclass' : 'comment',
			'text' : args.slice(2, args.length).join(" ") }
	},
	'msg' : (args) => {
		return { 
			'maxclass' : 'message',
			'text' : args.slice(2, args.length).join(" ") }
	},
	'floatatom' : (args) => {
		let pos = args.slice(0, 2);
		return { 
			'maxclass' : 'flonum',
			"patching_rect" : pos.concat([ 50.0, 22.0 ]) 
		}
	},
	'symbolatom' : (args) => {
		return { 
			'maxclass' : 'message',
			'text' : '' }
	},
	'tgl' : (args) => {
		let pos = args.slice(0, 2);		
		return { 
			'maxclass' : 'toggle',
			"patching_rect" : pos.concat([ 24.0, 24.0 ])
		}
	},
	'bng' : (args) => {
		let pos = args.slice(0, 2);		
		return { 
			'maxclass' : 'button',
			"patching_rect" : pos.concat([ 24.0, 24.0 ])
		}
	},
	'vsl' : () => {
		return { 
			'maxclass' : 'slider',
			'orientation' : 1 }
	},
	'hsl' : () => {
		return { 
			'maxclass' : 'slider',
			'orientation' : 2 }
	},
	// Max -> Pure Data Processor
	'message' : (args) => {
		return "msg " + args[0] + " " + args[1];
	},
	'comment' : (args) => {
		return "text " + args[0] + " " + args[1];
	},
	'button' : (args) => {
		return "obj " + args[0] + " bng 15 250 50 0 empty empty empty 17 7 0 10 -262144 -1 -1";
	},
	'toggle' : (args) => {
		return "obj " + args[0] + " tgl 15 0 empty empty empty 17 7 0 10 -262144 -1 -1 0 1";
	},
	'newobj' : (args) => {
		return "obj " + args[0] + " " + args[1];
	},
	'flonum' : (args) => {
		return "floatatom " + args[0] + " 8 " + "0 0 0" + " - - -, " + "f 8";
	},
	'number' : (args) => {
		return "floatatom " + args[0] + " 8 " + "0 0 0" + " - - -, " + "f 8";
	},
	'slider' : (args, prefs) => {
		return `obj ${args[0]} vsl 15 128 0 ${prefs.size} 0 0 empty empty empty 0 -9 0 10 -262144 -1 -1 3000 1`;
	},
	'inlet' : (args) => {
		return "obj " + args[0] +  " inlet";
	},
	'outlet' : (args) => {
		return "obj " + args[0] +  " outlet";
	},

}

if (process.argv[2] === undefined){
	console.error("Please provide a .maxpat or .pd file as argument");
} else {
	let files = process.argv.slice(2, process.argv.length);

	// process multiple files
	files.forEach((f) => {
		if (f.match(/.*\.(maxpat|pd)$/) === null){
			console.error("Please provide a .maxpat or .pd file as argument");
		} else if (f.match(/.*\.maxpat$/)){
			// convert the Maxpatch to Pd
			convertMax(f);
		} else {
			// convert the Pdpatch to Max
			convertPd(f);
		}
	});
}

function convertPd(file){
	console.log('=====> converting ' + file + ' to Max...');
	// the max patcher template
	let pat = { ...patchTemplate };
	// arrays to store boxes and connections
	let id = 0;
	// read the pd file as text
	let pd = fs.readFileSync(file, 'utf8');
	
	// replace the new lines with spaces
	pd = pd.replace(/\n/g, ' ');
	// divide into array of groups starting with #, ending with ;
	pd = pd.match(/(#([^;]+)\;)/g, '');
	// remove #N, #X and ; and split into token arrays
	pd = pd.map(x => x.replace(/(#N |#X |;)/g, '').split(' '));
	// console.log(pd);

	for (let i=0; i<pd.length; i++){
		// type of line; canvas, obj, connect, text, msg, floatatom
		let type = pd[i][0];
		let code = pd[i].slice(1, pd[i].length);
		
		if (type.match(/canvas/)){
			// if type matches canvas
			let rect = code.slice(0, 4);
			pat.patcher.rect = rect.slice(0, 4);
			// console.log('parse canvas', pat.patcher.rect);
		} else if (type.match(/(obj|msg|floatatom|text|symbolatom)/)){
			// if type matches obj|msg|floatatom|text|symbolatom
			let obj = {
				"box" : {
					"id" : "",
					"maxclass" : "comment",
					"patching_rect" : []
				}
			};
			let pos = code.slice(0, 2);
			
			obj.box.patching_rect = pos;
			obj.box.id = 'obj-'+id;
			
			let map;
			if (parser[type]){
				map = parser[type](code);
			} 
			if (parser[code[2]] || map === 'obj'){
				map = parser[code[2]](code);
			}
			// console.log('@map', map);
			
			Object.keys(map).forEach((k) => {
				obj.box[k] = map[k];
			});
			
			pat.patcher.boxes.push(obj);
			id++;
		} else if (type.match(/connect/)){
			// if type matches connect
			pat.patcher.lines.push({
				"patchline" : {
					"destination" : [ 'obj-'+code[2], code[3] ],
					"source" : [ 'obj-'+code[0], code[1] ]
				}
			});
		}
	}
	// console.log(pat.patcher);
	// console.log(pat.patcher.boxes);
	// console.log(pat.patcher.lines);
	let fInfo = path.parse(file);
	let outFile = path.join(fInfo.dir, fInfo.name + '.maxpat');
	fs.writeJsonSync(outFile, pat, { spaces: 2});
	console.log('=====> conversion complete!\n');
}

function convertMax(file){
	console.log('=====> converting ' + file + ' to Pd (recursive) ...');
	// string for output text
	pd = "";

	// read the maxpatch
	let patch = fs.readJsonSync(file);
	
	// recursively convert patchers
	parsePatcherMax(patch,patch.patcher);
	
	// write output file
	let fInfo = path.parse(file);
	let outFile = path.join(fInfo.dir, fInfo.name + '.pd');
	fs.writeFile(outFile, pd);
	console.log('=====> conversion complete!\n');
}

function parsePatcherMax(father, node){
	if (node){
		// the patcher name or main
		let patchername = 'main';
		// window settings
		let window = node.rect.join(" ");
		// all objects in the patch
		let objects = node.boxes;
		// storage for object connection id's
		let connections = [];
		// all connections between objects
		let lines = node.lines;

		// main patch, if has a text subpatch naming
		pd += "\n#N canvas " + window;
		if (father.text){
			// console.log('@name', father.text);
			patchername = father.text.split(" ")[1];
			pd += " " + patchername;
		}
		pd += " 10;";

		objects.forEach((obj) => {
			console.log('@object', obj);
			
			let type = obj.box.maxclass;
			let text = obj.box.text;
			let args = [];
			// if subpatcher this is 'p' or 'patcher'
			let objType = (text)? text.split(" ")[0] : 'undefined';
			
			console.log('@type', type, '@obj', objType, args);
			
			args.push(obj.box.patching_rect.slice(0, 2).join(" "));
			// process messages separately
			if (type === 'message'){
					// we have to escape special characters in message box 
					let processed_text = JSON.stringify(obj.box.text);
					processed_text = processed_text.replace(";\\r"," \\; ");
					processed_text = processed_text.replace('$','\\$');
					args.push(processed_text.slice(1,-1));
			}
			else if (obj.box.text){
				args.push(obj.box.text.replace('#','\\$'));
			} else {
				args.push(obj.box.text);
			}
			
			// add id's for creating connections between objects
			connections.push(obj.box.id);

			if (parser[type] === undefined){
				console.error('object of type:', type, 'unsupported');
					pd += "\n#X " + "obj "+ args[0] + " bogus" + ";";
				return;
			} 
			else if (objType === 'patcher' || objType === 'p'){
				console.log('	@toSubpatcher', text);
				// if subpatcher, parse that patcher first
				parsePatcherMax(obj.box, obj.box.patcher);

				console.log('	@backTo', patchername);
				return;
			} 
			else {
				console.log('@parsedObject', type, (args[1])? '['+args[1]+']' : '');
				pd += "\n#X " + parser[type](args, obj.box) + ";";
			}
		});

		// make all connections
		lines.forEach((ln) => {
			let connect = [];

			connect.push(connections.indexOf(ln.patchline.source[0]));
			connect.push(ln.patchline.source[1]);
			connect.push(connections.indexOf(ln.patchline.destination[0]));
			connect.push(ln.patchline.destination[1]);
			pd += "\n#X connect " + connect.join(" ") + ";";
		});
		
		// end subpatcher with a restore message
		if (patchername !== 'main'){
			pd += "\n#X restore " + father.patching_rect.slice(0, 2).join(" ") + " pd " + patchername + ";";
		}
	}
}