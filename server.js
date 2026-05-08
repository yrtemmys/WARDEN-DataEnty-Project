import express from 'express'
import http from 'http'
import db from './backend/database.js'
import {select, ability_by_title, select_alterations, select_paths,select_by_path_alteration} from './backend/db_routes.js'

let app = express()
let port = 8081
app.use(express.static('./static'))

app.set('view engine', 'html')
app.set('views','./public')

app.get('/', (req, res)=>{
	res.sendFile('./static/index.html')
})

app.all('/select/', select)
app.all('/ability/:title', ability_by_title)
app.all('/alterations', select_alterations)
app.all('/paths', select_paths)
app.all('/abilities/:path/:alteration', select_by_path_alteration)

app.listen(port, ()=>{
	console.log('Running on port: '+port)
})
