let button = document.getElementById("button1")
let output = document.getElementById("output")
let i_title = document.getElementById("i_title").value
//let i_alteration = document.getElementById("i_alteration").value
//let i_path = document.getElementById("i_path").value
let s_alteration = document.getElementById("s_alteration")
let s_path = document.getElementById("s_path")

button.addEventListener("click", do_thing)


async function fill_alterations(){
	let alterations = await fetch('http://localhost:8081/alterations')
	alterations = await alterations.json()
	alterations = alterations[0]["values"]
	s_alteration.innerHTML+=`<option value="`+'-1'+`">All</option>	`
	alterations.forEach((alt)=>{
		s_alteration.innerHTML+=`
		<option value="`+alt[0]+`">`+alt[1]+`</option>
		`
	})
}
fill_alterations()

async function fill_paths(){
	let paths = await fetch('http://localhost:8081/paths')
	paths = await paths.json()
	paths = paths[0]["values"]
	console.log(paths)
	s_path.innerHTML+=`<option value="`+'-1'+`">All</option>	`
	paths.forEach((path)=>{
		s_path.innerHTML+=`
		<option value="`+path[0]+`">`+path[1]+`</option>
		`
	})
}
fill_paths()

async function do_thing(){
	let si = s_alteration.options.selectedIndex
	let s_alt = s_alteration.options[si]
	console.log(s_alt.value + ' '+ s_alt.innerHTML)

	si = s_path.options.selectedIndex
	let selected_path = s_path.options[si]
	console.log(selected_path.value + ' '+ selected_path.innerHTML)
	
	console.log(i_title)
	
	let statement = ''
	if(i_title==''){
		statement = 'http://localhost:8081/abilities/'+selected_path.innerHTML+'/'+s_alt.innerHTML+''
	}else{
		statement = "http://localhost:8081/ability/"+i_title
	}
	console.log(statement)
	const result = await fetch(statement)
	let data = await result.json()
	data = data[0]["values"]
	console.log(data)
	let out = "<div class='ability'>"//data[0][1]+"<br>"+data[0][5]+"<br>"
	for(let i=0; i<data.length; i++){
		if(data[i][0]==null){
			out+='</div>'+'<div class="ability">'
			out+="<hr><h3>"+data[i][1]+"</h3><br>"
		}else{
			out+="<h5>"+data[i][1]+"</h5><br>"
		}
		out+=data[i][5]+"<br>"
	}
	out = '<div class="abiilty">'+out+'</div>'
	output.innerHTML= out
}
