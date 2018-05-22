const express = require('express') // server 
const mysql = require('mysql') // database
const app = express()
const bodyparser = require('body-parser') // post

// serve public static files (css, js)
app.use(express.static('./public'))

// decode post form
// it returns the information as json
app.use(bodyparser.urlencoded({urlencoded: false, extended: true}))
app.use(bodyparser.json())

// renders the ejs templates
app.set("view engine", "ejs")

// port for the app to be hosted to
const prt = 8080

// returns a connection to the mysql database
function getConnection(){
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'db_projekt',
        password: 'Asd123@Asd456'

    })
}

// handles the information from the form
// --> uses POST method
app.post("/add_event", (req, res) => {
    console.log('handling post...');
    const b_response = req.body
    
    const date = b_response.event_date
    const loc = b_response.event_loc

    var listedObjs = []

    Object.entries(b_response).forEach(
        ([key, value]) => {
            if(key.includes('event_obj')){
                // console.log(key);
                listedObjs.push(value)
            }
        }
    );


    const sql = getConnection()
    const qry = "INSERT INTO event_entries (EventDate, EventLoc) VALUES (?, ?)"

    sql.query(qry, [date, loc], (err, results, fields) => {
        if(err){
            console.log(err);
            res.sendStatus(500)
            res.end()
            return
        }
        const id = results.insertId;
        console.log('id of inserted ety: ' + id)

        const qry2 = "INSERT INTO event_objects (EventId, Description) VALUES (?, ?)"

        listedObjs.forEach( elem => {
            sql.query(qry2, [id, elem], (err, results, fields) => {
                if(err){
                    console.log(err);
                    res.sendStatus(500)
                    res.end()
                    return
                }
                console.log('id of inserted obj: ' + results.insertId)
            })
        })

    })
    res.redirect("/")
})

// return form
app.get("/form", (req, res) => {
    res.render("form")
})


// returns all the event entries and their objects
app.get("/", (req, res) => {
    console.log('Api request for entry');
    const sql = getConnection()

    let query = "SELECT e.EventDate, e.EventLoc, (SELECT GROUP_CONCAT(o.Description) "
            + " FROM event_objects o WHERE e.EventId = o.EventId) AS Objects"
            + " FROM event_entries e"
            + " ORDER BY e.EventDate";
    
    sql.query(query, (err, results, fields) => {
        if(err){
            console.log(err);
            res.sendStatus(500)
            res.end()
            return
        }

        var jsonR = []
        
        results.forEach(elem => {
            
            var entry = {
                EventDate: elem.EventDate.toLocaleDateString(),
                EventLoc: elem.EventLoc,
                Objects: elem.Objects
            }
            jsonR.push(entry)
        })
        
        res.render("entry", {
            jsonResults: jsonR
        })
    })
})

app.listen(prt, () => {
    console.log('Running app in port ' + prt + '...');
})