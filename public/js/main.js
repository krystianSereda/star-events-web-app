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