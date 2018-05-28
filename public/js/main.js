var objectCount = 0;

// add text input for object
function addObject(){
    objectCount++;
    let objInput = '<input type="text" name="event_obj' + objectCount +'" placeholder="Event object ' + (objectCount + 1)  +'">'; 
    $('#obj_container').append(objInput);
}

// remove last text input
function removeObject(){
    $('input[name="event_obj' + objectCount + '"]').remove();
    objectCount--;
}

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

    // enable them
    date.disabled = false;
    plac.disabled = false;
    document.getElementById('add_b').disabled = false;
    document.getElementById('del_b').disabled = false;
    document.getElementById('end_b').disabled = false;




    // set the info
    date.value = in_date;
    plac.value = in_place;

    var inputs = "";
    const inp = '<input type="text"';

    if(objNum > 0){
        for(var i = 0; i < objNum; i++){
            const v = elem.children[1].children[i].children[0].innerHTML;
            const val = inp + 'value="' + v +'">';
            inputs += val;
        }

        objs.innerHTML = inputs;
    }
    else{
        objs.innerHTML = inp + '>';
    }
    
    
}


var editObjectCount = 1;
function handleAddObjectPressed(){
    console.log('add object');
    var inputs = "";
    const inp = '<input type="text">';

    editObjectCount++;

    for(var i = 0; i < editObjectCount; i++){
        inputs += inp;
    }

    document.getElementById('editor_objects').innerHTML = inputs;
}

function handleDeleteObjectPressed(){
    editObjectCount -= 2;
    handleAddObjectPressed();
}

function handleSaveEditPressed(){
    console.log('save edit');
    
}
