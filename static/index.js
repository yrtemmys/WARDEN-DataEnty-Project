let sidebar = document.getElementById("sidebar_list")
let i_title = document.getElementById("i_title").value
//let i_alteration = document.getElementById("i_alteration").value
//let i_path = document.getElementById("i_path").value
let s_alteration = document.getElementById("s_alteration")
let s_path = document.getElementById("s_path")
let detail_view = document.getElementById("char_abilities")


const port = 8081
const url = 'http://localhost:'+port+'/'

async function fill_alterations(){
	let alterations = await fetch(url+'alterations')
	alterations = await alterations.json()

	s_alteration.innerHTML+=`<option value="`+'-1'+`">All</option>	`
	for(let alt in alterations){
		alt = alterations[alt]
		s_alteration.innerHTML+=`
		<option value="`+alt.alteration_id+`">`+alt.title+`</option>
		`
	}
}
fill_alterations()

async function fill_paths(){
	let paths = await fetch(url+'paths')
	paths = await paths.json()

	s_path.innerHTML+=`<option value="`+'-1'+`">All</option>	`
	for(let p in paths){
		p=paths[p]
		s_path.innerHTML+=`
		<option value="`+p.path_id+`">`+p.title+`</option>
		`
	}
}
fill_paths()

async function load_character_to_doc(id){
	let c  = await fetch(url+'character/'+id)
	document.character = await c.json()
}
//load_character_to_doc(1)

document.getElementById('get_character').addEventListener('click', get_character)
async function get_character(){
	let id_field = document.getElementById('character_id').value
	await load_character_to_doc(id_field)


	character = document.character
	
	calc_doc()
}

function write_character_to_doc(){
	let char_name = document.getElementById("character_name")
	let char_level = document.getElementById("character_level")
	let char_advance_points = document.getElementById("character_advance_points")

	let character = document.character
	let meta = character.meta
	meta.name = char_name.value
	meta.level = char_level.value
	meta.advance_points = char_advance_points.value
	
}

let button = document.getElementById("button1")
button.addEventListener("click", search_and_add)
async function search_and_add(){
	await search()
	load_abilities_from_doc(document.warden_search_results, sidebar)
}

async function search(){
	i_title = document.getElementById("i_title").value
	let result
	if(i_title!=''){
		result = await fetch(url+'ability/'+i_title)
	}else{
		let index = 0
		index = s_alteration.options.selectedIndex
		let alt = s_alteration.options[index].innerHTML
		index = s_path.options.selectedIndex
		let path = s_path.options[index].innerHTML

		result = await fetch(url+'abilities/'+path+'/'+alt)
	}
	if(result==undefined) return;
	result = await result.json()

	document.warden_search_results = result 

	//return result
}

document.getElementById('save_character').addEventListener("click", save_character)
async function save_character(){
	write_character_to_doc()
	await fetch(url+'save', {
		method: 'POST',
		headers:{"Content-Type":'application/json'},
		body: JSON.stringify(document.character)
	})
}

document.getElementById('new_character').addEventListener('click', new_character)
async function new_character(){
	let new_id = await fetch(url+'next_id')
	new_id=await new_id.json()

	let id_field = document.getElementById('character_id')
	id_field.value=new_id

	return new_id

}

//function add_abilities_to_character_doc(result){
//	for(let ability in result){
//		ability=result[ability]
//		let html = ability_to_html(ability,true)
//		output.innerHTML += html
//	}
//}

function ability_to_html(ability,button){
	let html = `
		<div class='ability'>
			<div class='ability_title'>`+ability.title+` </div>
			<div class='ability_description'>`+ability.description+`</div>
	`
	for(let feat in ability.feats){
		feat = ability.feats[feat]
		html +=`
			<div class='feat'>
				<div class='feat_title'>
					<input type='checkbox'>
					<label>`+feat.title+`<label>
				</div>
				<div class='feat_description'>`+feat.description+`</div>
			</div>
		`
	}
	if(button) html+=add_to_character_button()
	html +=`
		<div class='hidden json'>`+JSON.stringify(ability)+`</div>
		</div>
	`
	return html
}
function add_to_character_button(){
	return `
		<div class='add_ability_to_charcter'>
			<input type='button' class='add_ability_to_character_button' value='Add'/>
		</div>
	`
}
function load_abilities_from_doc(source, destination){
	destination.innerHTML=''
	let button = false
	if(destination==sidebar) button=true
	for(let ability in source){
		ability= source[ability]
		destination.innerHTML+= ability_to_html(ability,button)
	}
	if(button){
		add_add_button_functionality()
	}
}
function add_add_button_functionality(){
	const add_buttons = document.getElementsByClassName("add_ability_to_character_button");
	for(let i = 0; i<add_buttons.length; i++){
		let b = add_buttons.item(i)
		b.addEventListener("click", ()=>{
			let html = b.parentElement.parentElement.outerHTML
			html = html.substring(html.search('hidden json'))
			html = html.substring(html.search('{'),html.search('</div>'))
			let json = JSON.parse(html)
			document.character.abilities.push(json)
			load_abilities_from_doc(document.character.abilities, detail_view)
		})
	}
}

document.getElementById('export_character').addEventListener('click', export_character)
async function export_character(){
	const data = new Blob([JSON.stringify(document.character)],{type:'application/json'})

	if(window.showSaveFilePicker){
		const fileHandler = await window.showSaveFilePicker({
			types:[{description: 'JSON File', accept:{'application/json':['.json']}}]
		})
		const fileStream = await fileHandler.createWritable()

		await fileSteam.write(data)
		await fileSteam.close()
	}else{
		const url = URL.createObjectURL(data)
		const a = document.createElement('a')
		a.href = url
		a.download = document.character.meta.name+'.json'
		a.click()
		URL.revokeObjectURL(url)
	}
}


document.getElementById('import_character').addEventListener('change', import_character)
async function import_character(){
	let fileReader = new FileReader()
	fileReader.onload = (async function(){
		let id = await new_character()
		console.log(id)
		let imported_character = JSON.parse(fileReader.result)
		imported_character.meta.character_id = id

		document.character=imported_character
		calc_doc()
	})
	fileReader.readAsText(this.files[0])
}

function doc_to_page(){
	let c = document.character

	let char_name = document.getElementById("character_name")
	let char_level = document.getElementById("character_level")
	let char_advance_points = document.getElementById("character_advance_points")

	char_name.value=c.meta.name
	char_level.innerHTML=c.meta.level
	char_advance_points.innerHTML=c.meta.advance_points

	let meta = document.getElementById('char_meta')
	meta.innerHTML=''
	for(let m in c.meta){
		let v = c.meta[m]
		meta.innerHTML += `<div class='meta'><b>`+m+`: </b>`+v+`</div>`
	}
	
	let resources = document.getElementById('char_resources')
	resources.innerHTML=''
	for(let r in c.resources){
		let v = c.resources[r]
		resources.innerHTML+=`<div class='resource'><b>`+r+`: </b>`+v+`</div>`
	}

	let origins = document.getElementById('char_origins')
	origins.innerHTML=''
	for(let o in c.origin){
		o=c.origin[o].title
		origins.innerHTML += `<div class='origin'><b>Origin: </b>`+o+`</div>`
	}

	let ranks = document.getElementById('char_ranks')
	ranks.innerHTML=''
	for(let r in c.ranks){
		let v = c.ranks[r]
		ranks.innerHTML += `<div class='rank'><b>`+r+`: </b>`+v+`</div>`
}

	let skills = document.getElementById('char_skills')
	skills.innerHTML=''
	for(let s in c.skill){
		let v = c.skill[s]
		skills.innerHTML += `<div class='skill'><b>`+s+`: </b>`+v+`</div>`
	}

	load_abilities_from_doc(c.abilities, detail_view)

}
function calc_doc(){
	let c = document.character

	// Advance Points
	c.meta.advance_points = c.meta.level * 2

	//Hit Points
	c.resources['Hit Points'] = 10 + c.ranks['Toughness']
	//Strain
	c.resources['Strain'] = 10 + c.ranks['Resolve']
	
	//Skills
	for(let s in c.skill){
		c.skill[s] = c.ranks['Skill']
	}

	doc_to_page()
}

//(()=>{
	let updater = document.getElementsByClassName('updater')
	for(let i of Array(updater.length).keys()){
		updater.item(i).addEventListener('change',()=>{
			console.log("hi")
			write_character_to_doc()
			calc_doc()
		})
	}
//})()

//(()=>{
	let btns = document.getElementsByClassName('toggle_popup')
	for(let i of Array(btns.length).keys()){
		btns.item(i).addEventListener('click', ()=>{
			let c = document.getElementById('controls')
			c.classList.toggle('hidden')
		})
	}
//})()
	












async function do_thing(){
	
	i_title = document.getElementById("i_title").value

	let si = s_alteration.options.selectedIndex
	let s_alt = s_alteration.options[si]
	//console.log(s_alt.value + ' '+ s_alt.innerHTML)

	si = s_path.options.selectedIndex
	let selected_path = s_path.options[si]
	//console.log(selected_path.value + ' '+ selected_path.innerHTML)
	
	let statement = ''
	if(i_title==''){
		statement = 'http://localhost:8081/abilities/'+selected_path.innerHTML+'/'+s_alt.innerHTML+''
	}else{
		statement = "http://localhost:8081/ability/"+i_title
	}
	const result = await fetch(statement)
	let data = await result.json()
	data = data[0]["values"]
	let out = ''    //"<div class='ability'>"
	for(let i=0; i<data.length; i++){
		if(data[i][0]!=null){
			let parent = data[i][0]
		}
		if(data[i][0]==null){
			if(i>1){
				out+=`
					<br>
					<input type="button" class="add_me" value="Add">
					</div>
				`
			}
			out+='<div class="ability">'
			//title ability
			out+="<div class='ability_title'>"+data[i][1]+"</div><br>"
		}else{
			//title feat
			out+=`
				<div class='feat_title'>
					<input type="checkbox">
					<label>`+data[i][1]+`<label>
				</div><br>
			`
		}
		//description
		out+=data[i][5]+"<br>"
	}
	out+=`
		<br>
		<input type="button" class="add_me" value="Add">
		</div>
	`
	output.innerHTML= out

	const add_buttons = document.getElementsByClassName("add_me");
	for(let i = 0; i<add_buttons.length; i++){
		let b = add_buttons.item(i)
		b.addEventListener("click", ()=>{
			detail_view.innerHTML += b.parentElement.outerHTML 
		})
	}
}

