var editObjectCount = 1;

// fill the forms in the editor
function handleEditButtonPressed(id){

    // get the info
    var elem = document.getElementById(id)
    const objNum = elem.children[1].childElementCount

    const in_date = elem.children[0].children[0].innerHTML;
    const in_place = elem.children[0].children[1].innerHTML;

    // get the inputs
    var date = document.getElementById('editor_date');
    var plac = document.getElementById('editor_place');
    var objs = document.getElementById('editor_objects');
    
    document.getElementById('editor_id').value = "" + id;

    // delete button
    document.getElementById('los_b').style.display = "block";
    document.getElementById('los_b').classList.add("fade-in")

    // enable them
    date.disabled = false;
    plac.disabled = false;
    document.getElementById('add_b').disabled = false;
    document.getElementById('del_b').disabled = false;
    document.getElementById('end_b').disabled = false;
    document.getElementById('can_b').disabled = false;

    // set the info
    date.value = in_date;
    plac.value = in_place;

    var inputs = "";
    const inp = '<input type="text"';

    if(objNum > 0){
        for(var i = 0; i < objNum; i++){
            const v = elem.children[1].children[i].children[0].innerHTML;
            const val = inp + 'value="' + v +'" id="event_obj'+ (i +1) + '">';
            inputs += val;
        }

        objs.innerHTML = inputs;
    }
    else{
        objs.innerHTML = inp + 'id="event_obj1">';
    }
    
    editObjectCount = objNum;
    
}


// editor add 1 object
function handleAddObjectPressed(){
    const children = document.getElementById('editor_objects').children.length;

    var inputs = "";
    const inp = '<input type="text"';

    editObjectCount++;

    for(var i = children; i < editObjectCount; i++){
        inputs += inp + 'id="event_obj' + (i+1) + '">';
    }
    const old = document.getElementById('editor_objects').innerHTML;
    
    document.getElementById('editor_objects').innerHTML = old + inputs;
}

// editor delete 1 object
function handleDeleteObjectPressed(){
    if (editObjectCount == 1){
        document.getElementById('editor_objects').childNodes[0].value = "";
        return
    }
    var events =  document.getElementById('editor_objects');
    const lastchild = events.children.length - 1;
    events.removeChild(events.children[lastchild]);
    editObjectCount--;
}

function appendListItem(data){
    var list = document.getElementById('list')
    var listItem = document.createElement("li");
    listItem.classList.add("fade-in")
    listItem.id = "entry_id_" + data.EventId
    const title = '<div class="entry-title">'
                    +'<h3>' + data.EventDate + '</h3>'
                    +'<h3>' + data.EventLoc + '</h3>'
                    +'</div>'
    var body = "";
    if(data.Objects){
        body += "<ol>"
        data.Objects.split(',').forEach(obj => {
            body += "<li>"
            body += "<h4>" + obj + "</h4>"
            body += "</li>"
        })
        body += "</ol>"
    }
    else{
        body += '<h4 class="no-objects">Keine Objekte</h4>'
    }
    const button = "<button onclick=\""
    + "handleEditButtonPressed(\'entry_id_" + data.EventId + "\')\">"
    + "mehr</button>"
    
    listItem.innerHTML = title + body + button

    list.appendChild(listItem)
}

// update the entry list
function updateList(){
    // empty out list
    var list = document.getElementById('list')
    list.innerHTML = ""

    const data = fetch("/entry")
    .then(response => {
        return response.json()
    }).then(json => {
        json.forEach(item => {
            appendListItem(item)
        })
        checkHeight()
    }).catch(error =>{
        console.log(error);
    });
}

// send post request using fetch post
async function postData(data){
    // data is a json object
    const url = "/add_event";
    const response = await fetch(url, {
        method: 'post',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    }).then(response => { 
        return response.json()
    }).then(json =>{
        // console.log(json);
        updateList()
    }).catch(error => {
        console.log(error);
    })
}

// send post request using fetch put
async function putData(data){
    // data is a json object
    const url = "/edit_event";
    const response = await fetch(url, {
        method: 'put',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    }).then(response => { 
        return response.json()
    }).then(json =>{
        // console.log(json);
        updateList()
    }).catch(error => {
        console.log(error);
    })
   
}

// send delete request using fetch delete
async function deleteData(id){
    const url = "/delete"
    const response = await fetch(url, {
        method: 'delete',
        body: JSON.stringify({id: id}),
        headers: {'Content-Type': "application/json"}
    }).then( response => {
        return response.json()
    }).then(json => {
        updateList()
    }).catch(error => console.log(error))
}


// check if the fields are properly filled
// send the post request
function handleSaveEditPressed(){
    // TODO: check fields


    var date = document.getElementById('editor_date');
    var plac = document.getElementById('editor_place');
    var objs = document.getElementById('editor_objects').childNodes;
    const ID = document.getElementById('editor_id').value.split('_')[2];
    
    const data = {
        event_date: date.value,
        event_loc: plac.value,
        id: ID
    }
    objs.forEach(obj => {
        data[obj.id] = obj.value;
    })

    // send data
    
    // if the id is empty, then post data
    if(data.id){
        
        putData(data);
    }
    else{
        
        postData(data)
    }
    
    handleCancelEditPressed();
}

// set initial editor state
function handleCancelEditPressed(){
    var date = document.getElementById('editor_date');
    var plac = document.getElementById('editor_place');
    var objs = document.getElementById('editor_objects');
    document.getElementById('editor_id').value = "";
    date.disabled = true;
    plac.disabled = true;
    date.value = "";
    plac.value = "";
    document.getElementById('add_b').disabled = true;
    document.getElementById('del_b').disabled = true;
    document.getElementById('end_b').disabled = true;
    document.getElementById('can_b').disabled = true;
    objs.innerHTML = "<input type='text' disabled>";
    // delete button
    document.getElementById('los_b').style.display = "none";
    document.getElementById('los_b').classList.remove("fade-in")
}

// create a new entry
function handleNewEntry(){
    document.getElementById('los_b').style.display = "none";

    var date = document.getElementById('editor_date');
    var plac = document.getElementById('editor_place');
    var objs = document.getElementById('editor_objects');
    
    document.getElementById('editor_id').value = "";

    // enable them
    date.disabled = false;
    plac.disabled = false;
    date.value = "";
    plac.value = "";
    document.getElementById('add_b').disabled = false;
    document.getElementById('del_b').disabled = false;
    document.getElementById('end_b').disabled = false;
    document.getElementById('can_b').disabled = false;

    objs.innerHTML = '<input type="text" id="event_obj1">'
}

function handleDeleteEntry(){
    const ID = document.getElementById('editor_id').value.split('_')[2];
    if(ID){
        deleteData(ID)
    }
    handleCancelEditPressed()
}
