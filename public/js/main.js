(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.handler = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const pageManager = require('./page-manager')

var editObjectCount = 1;

/** ********************************* functions **********************************/

// returns the element (less redundancy)
function DOM (id) {
    return document.getElementById(id);
}

// enable / disable the editor input fields, and optionally
// fill them with a given value
function toggleEditorInputs (disable, inDate=null, inPlace=null) {
    var day = DOM('editor_day')
    var month = DOM('editor_month')
    var year = DOM('editor_year')

    var plac = DOM('editor_place');
    if (inDate !== null) {
        if (inDate !== "") {
            const date = inDate.split('-')
            day.value = parseInt(date[2])
            month.value = parseInt(date[1])
            year.value = parseInt(date[0])
        } else {
            day.value = ""
            month.value = ""
            year.value = ""
        }
    }
    if (inPlace != null) {
        plac.value = inPlace
        plac.onchange()
    }

    day.disabled = disable;
    month.disabled = disable;
    year.disabled = disable;
    plac.disabled = disable;
    DOM('add_b').disabled = disable;
    DOM('del_b').disabled = disable;
    DOM('end_b').disabled = disable;
    DOM('can_b').disabled = disable;
    
}

// append an entry item to the entry list
// given a json data object
function appendListItem (data) {
    var list = DOM('list')
    var listItem = document.createElement("li");
    listItem.classList.add("fade-in")
    listItem.id = "entry_id_" + data.EventId
    const title = '<div class="entry-title">'
                    +'<h3>' + data.EventDate + '</h3>'
                    +'<h3>' + data.EventLoc + '</h3>'
                    +'</div>'
    var body = "";
    if (data.Objects) {
        body += "<ol>"
        data.Objects.split(',').forEach(obj => {
            body += "<li>"
            body += "<h4>" + obj + "</h4>"
            body += "</li>"
        })
        body += "</ol>"
    } else {
        body += '<h4 class="no-objects">Keine Objekte</h4>'
    }
    const button = "<button onclick=\""
    + "handler.handleEditButtonPressed(\'entry_id_" + data.EventId + "\')\">"
    + "mehr</button>"
    
    listItem.innerHTML = title + body + button

    list.appendChild(listItem)
}

// update the entry list
// get all items from API and 
// append each of them to the list
// after that, recalculate the pages
function updateList () {
    // empty out list
    var list = DOM('list')
    list.innerHTML = ""

    const data = fetch("/entry")
    .then(response => {
        return response.json()
    }).then(json => {
        json.forEach(item => {
            appendListItem(item)
        })
        // recalculate pages
        pageManager.checkHeight()
    }).catch(error => {
        console.log(error);
    });
}

// check the editor fields, 
// returns true if it's good to go, else false
function checkFields () {
    var everythingGood = true

    // date
    const year = DOM('editor_year').value
    const month = DOM('editor_month').value
    const day = DOM('editor_day').value

    if (year != null && month != null && day != null) {
        // padding with 0's
        var m = month.toString().length < 2 ? "0" + month : month
        var d = day.toString().length < 2 ? "0" + day : day

        var dateval = ""
        dateval += "" + year
        dateval += "-" + m
        dateval += "-" + d

        var date = new Date(dateval)
        const isDate = date.toString() !== "Invalid Date"

        if (!isDate) {
            DOM("editor_day").classList.add('error-field')
            DOM("editor_month").classList.add('error-field')
            DOM("editor_year").classList.add('error-field')
            everythingGood = false
            
        }

    } else {
        DOM("editor_day").classList.add('error-field')
        DOM("editor_month").classList.add('error-field')
        DOM("editor_year").classList.add('error-field')
        everythingGood = false
    }

    // place
    // only check if its not empty
    const locval = DOM("editor_place").value
    if (!locval || locval === "") {
        DOM("editor_place").classList.add('error-field')
        everythingGood = false
    }

    return everythingGood
}

// send post request using fetch post
// asynchronious await
async function postData (data) {
    // data is a json object
    const url = "/add_event";
    const response = await fetch(url, {
        method: 'post',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    }).then(response => { 
        return response.json()
    }).then(json => {
        // console.log(json);
        updateList()
    }).catch(error => {
        console.log(error);
    })
}
// send post request using fetch put
// asynchronious await
async function putData (data) {
    // data is a json object
    const url = "/edit_event";
    const response = await fetch(url, {
        method: 'put',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    }).then(response => { 
        return response.json()
    }).then(json => {
        // console.log(json);
        updateList()
    }).catch(error => {
        console.log(error);
    })
   
}

// send delete request using fetch delete
// asynchronious await
async function deleteData (id) {
    const url = "/delete"
    const response = await fetch(url, {
        method: 'delete',
        body: JSON.stringify({id: id}),
        headers: {'Content-Type': "application/json"}
    }).then(response => {
        return response.json()
    }).then(json => {
        updateList()
    }).catch(error => console.log(error))
}

/** ********************************* on click handlers **********************************/

var objExport = {

    // 'mehr' button handlers
    // fill the forms in the editor
    handleEditButtonPressed: function (id) {
        this.handleCancelEditPressed(true);

        // get the info
        var elem = DOM(id)
        const objNum = elem.children[1].childElementCount

        const inDate = elem.children[0].children[0].innerHTML;
        const inPlace = elem.children[0].children[1].innerHTML;

        toggleEditorInputs(false, inDate, inPlace)

        var objs = DOM('editor_objects');

        DOM('editor_id').value = "" + id;

        // delete button
        DOM('los_b').style.display = "block";
        DOM('los_b').classList.add("fade-in")

        var inputs = "";
        const inp = '<input type="text"';

        if (objNum > 0) {
            for (var i = 0; i < objNum; i++) {
                const v = elem.children[1].children[i].children[0].innerHTML;
                const val = inp + 'value="' + v +'" id="event_obj'+ (i +1) + '">';
                inputs += val;
            }

            objs.innerHTML = inputs;
        } else {
            objs.innerHTML = inp + 'id="event_obj1">';
        }
        
        editObjectCount = objNum;
        
    },

    // editor add 1 object
    // to event object list
    handleAddObjectPressed: function () {
        const children = DOM('editor_objects').children.length;

        editObjectCount++;

        for (var i = children; i < editObjectCount; i++) {
            var input = document.createElement("input")
            input.type = "text"
            input.id = "event_obj" + (i+1)
            DOM('editor_objects').appendChild(input)
        }
    },

    // editor delete 1 object
    // from event object list
    handleDeleteObjectPressed: function () {
        if (editObjectCount === 1) {
            DOM('editor_objects').childNodes[0].value = "";
            return
        }
        var events = DOM('editor_objects');
        const lastchild = events.children.length - 1;
        events.removeChild(events.children[lastchild]);
        editObjectCount--;
    },

    // check if the fields are properly filled
    // send the post request
    handleSaveEditPressed: function () {
        // check the fields
        if (!checkFields()) {
            return
        }
        
        var date = ""
        date += "" + DOM('editor_year').value
        date += "-" + DOM('editor_month').value
        date += "-" + DOM('editor_day').value
        var plac = DOM('editor_place');
        var objs = DOM('editor_objects').childNodes;
        const ID = DOM('editor_id').value.split('_')[2];
        
        const data = {
            event_date: date,
            event_loc: plac.value,
            id: ID
        }
        objs.forEach(obj => {
            // only add field objects
            if (obj.value && obj.value !== "") {
                data[obj.id] = obj.value;
            }
        })

        // put data
        // if the id is empty, then post data
        if (data.id) {
            putData(data);
        } else {
            postData(data)
        }
        
        this.handleCancelEditPressed();
    },

    // set initial editor state
    handleCancelEditPressed: function (notoggle=false) {
        var objs = DOM('editor_objects');
        objs.innerHTML = "<input type='text' disabled>";
        
        DOM('editor_id').value = "";

        if (!notoggle) {
            toggleEditorInputs(true, "", "")
        }

        // delete button
        DOM('los_b').style.display = "none";
        DOM('los_b').classList.remove("fade-in")

        DOM('editor_place').classList.remove('error-field')
        DOM('editor_day').classList.remove('error-field')
        DOM('editor_month').classList.remove('error-field')
        DOM('editor_year').classList.remove('error-field')

    },

    // create a new entry
    handleNewEntry: function () {
        this.handleCancelEditPressed();
        DOM('los_b').style.display = "none";
        
        var objs = DOM('editor_objects');
        
        objs.innerHTML = '<input type="text" id="event_obj1">';
        
        DOM('editor_id').value = "";

        toggleEditorInputs(false, "", "");

        editObjectCount = 1;

    },

    // delete entry in the editor
    handleDeleteEntry: function () {
        const ID = DOM('editor_id').value.split('_')[2];
        if (ID) {
            deleteData(ID)
        }
        this.handleCancelEditPressed()
    },

    handlePageButton: function (isPlus) {
        pageManager.handlePageButton(isPlus)
    },

    // check for min max values for dates
    checkMinMax: function (elem) {
        const max = parseInt(elem.max)
        const min = parseInt(elem.min)
        
        if (elem.value <= max && elem.value >= min) {
            return
        }

        if (elem.value < min) {
            elem.value = min
            return
        }
        
        if (elem.value > max) {
            elem.value = max
        }
    }

}

module.exports = objExport

},{"./page-manager":2}],2:[function(require,module,exports){
// fill the page dictionary
var currentPage;
var pages;
function fillPages (pageNum, lastIndex) {
    pages[pageNum] = lastIndex
}

// hide the correct items
function hideOtherPages () {
    const items = document.getElementById('list').children;
    const itemsNum = items.length;

    var firstOfPage = -1;
    var lastOfPage = pages[currentPage];
    
    // if previous page exists
    if (pages[currentPage-1] != null) {
        firstOfPage = pages[currentPage-1] + 1
    } else {
        firstOfPage = 0;
    }

    for (var i = 0; i < itemsNum; i++) {
        if (i < firstOfPage || i > lastOfPage) {
            items[i].style.display = "none";
        } else {
            items[i].style.display = "block";
        }
    }
}

// display number of pages and current page
function pageStatus () {
    var status = document.getElementById('page_status');
    var size = 0;
    var key;
    for (key in pages) {
        if (pages.hasOwnProperty(key)) {
            size++;
        }
    }
    
    var msg = currentPage + " of " + size;
    status.innerText = msg;
}

// display the items that fit on the window, without scrolling
function checkHeight () {
    // calc the window height to fit a maximal amount of items
    const winHei = window.innerHeight - 140;

    const listItems = document.getElementById('list').children;
    const itemsNum = listItems.length;

    var itemsHeight = 0;
    var pageNum = 1;
    
    currentPage = 1;
    pages = {};

    for (var i = 0; i < itemsNum; i++) {
        // show them all again, to be messured
        listItems[i].style.display = "block";
        var h = listItems[i].offsetHeight;
        itemsHeight += h;
        
        // if the items height is bigger than the window
        // then asign them to a different page
        if (itemsHeight >= winHei) {
            fillPages(pageNum, (i - 1));
            itemsHeight = h;
            pageNum++;
        }
        if (i === itemsNum - 1) {
            fillPages(pageNum, i);
            pageNum++;
        }

    }
    // hide items after the last item of the page
    hideOtherPages();
    // show number of pages and current one
    pageStatus();
    
}
// handle buttons next page and previous page
function handlePageButton (isPlus) {
    
    if (isPlus) {
        const next = currentPage + 1;

        if (next in pages) {
            currentPage = next;
        }
    } else {
        const prev = currentPage - 1;

        if (prev in pages) {
            currentPage = prev;
        }
    }

    hideOtherPages();
    pageStatus();
}

window.onload = function () {
    checkHeight();
}

var resizer;
window.onresize = function () {
    clearTimeout(resizer)
     resizer = this.setTimeout(() => {
        checkHeight();
    }, 200)

}

exports.checkHeight = function () {
    checkHeight()
}

exports.handlePageButton = function (isPlus) {
    handlePageButton(isPlus)
} 

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb21waWxhYmxlcy9qcy9tYWluLmpzIiwiY29tcGlsYWJsZXMvanMvcGFnZS1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgcGFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL3BhZ2UtbWFuYWdlcicpXG5cbnZhciBlZGl0T2JqZWN0Q291bnQgPSAxO1xuXG4vKiogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIGZ1bmN0aW9ucyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyByZXR1cm5zIHRoZSBlbGVtZW50IChsZXNzIHJlZHVuZGFuY3kpXG5mdW5jdGlvbiBET00gKGlkKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbn1cblxuLy8gZW5hYmxlIC8gZGlzYWJsZSB0aGUgZWRpdG9yIGlucHV0IGZpZWxkcywgYW5kIG9wdGlvbmFsbHlcbi8vIGZpbGwgdGhlbSB3aXRoIGEgZ2l2ZW4gdmFsdWVcbmZ1bmN0aW9uIHRvZ2dsZUVkaXRvcklucHV0cyAoZGlzYWJsZSwgaW5EYXRlPW51bGwsIGluUGxhY2U9bnVsbCkge1xuICAgIHZhciBkYXkgPSBET00oJ2VkaXRvcl9kYXknKVxuICAgIHZhciBtb250aCA9IERPTSgnZWRpdG9yX21vbnRoJylcbiAgICB2YXIgeWVhciA9IERPTSgnZWRpdG9yX3llYXInKVxuXG4gICAgdmFyIHBsYWMgPSBET00oJ2VkaXRvcl9wbGFjZScpO1xuICAgIGlmIChpbkRhdGUgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKGluRGF0ZSAhPT0gXCJcIikge1xuICAgICAgICAgICAgY29uc3QgZGF0ZSA9IGluRGF0ZS5zcGxpdCgnLScpXG4gICAgICAgICAgICBkYXkudmFsdWUgPSBwYXJzZUludChkYXRlWzJdKVxuICAgICAgICAgICAgbW9udGgudmFsdWUgPSBwYXJzZUludChkYXRlWzFdKVxuICAgICAgICAgICAgeWVhci52YWx1ZSA9IHBhcnNlSW50KGRhdGVbMF0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXkudmFsdWUgPSBcIlwiXG4gICAgICAgICAgICBtb250aC52YWx1ZSA9IFwiXCJcbiAgICAgICAgICAgIHllYXIudmFsdWUgPSBcIlwiXG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluUGxhY2UgIT0gbnVsbCkge1xuICAgICAgICBwbGFjLnZhbHVlID0gaW5QbGFjZVxuICAgICAgICBwbGFjLm9uY2hhbmdlKClcbiAgICB9XG5cbiAgICBkYXkuZGlzYWJsZWQgPSBkaXNhYmxlO1xuICAgIG1vbnRoLmRpc2FibGVkID0gZGlzYWJsZTtcbiAgICB5ZWFyLmRpc2FibGVkID0gZGlzYWJsZTtcbiAgICBwbGFjLmRpc2FibGVkID0gZGlzYWJsZTtcbiAgICBET00oJ2FkZF9iJykuZGlzYWJsZWQgPSBkaXNhYmxlO1xuICAgIERPTSgnZGVsX2InKS5kaXNhYmxlZCA9IGRpc2FibGU7XG4gICAgRE9NKCdlbmRfYicpLmRpc2FibGVkID0gZGlzYWJsZTtcbiAgICBET00oJ2Nhbl9iJykuZGlzYWJsZWQgPSBkaXNhYmxlO1xuICAgIFxufVxuXG4vLyBhcHBlbmQgYW4gZW50cnkgaXRlbSB0byB0aGUgZW50cnkgbGlzdFxuLy8gZ2l2ZW4gYSBqc29uIGRhdGEgb2JqZWN0XG5mdW5jdGlvbiBhcHBlbmRMaXN0SXRlbSAoZGF0YSkge1xuICAgIHZhciBsaXN0ID0gRE9NKCdsaXN0JylcbiAgICB2YXIgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZChcImZhZGUtaW5cIilcbiAgICBsaXN0SXRlbS5pZCA9IFwiZW50cnlfaWRfXCIgKyBkYXRhLkV2ZW50SWRcbiAgICBjb25zdCB0aXRsZSA9ICc8ZGl2IGNsYXNzPVwiZW50cnktdGl0bGVcIj4nXG4gICAgICAgICAgICAgICAgICAgICsnPGgzPicgKyBkYXRhLkV2ZW50RGF0ZSArICc8L2gzPidcbiAgICAgICAgICAgICAgICAgICAgKyc8aDM+JyArIGRhdGEuRXZlbnRMb2MgKyAnPC9oMz4nXG4gICAgICAgICAgICAgICAgICAgICsnPC9kaXY+J1xuICAgIHZhciBib2R5ID0gXCJcIjtcbiAgICBpZiAoZGF0YS5PYmplY3RzKSB7XG4gICAgICAgIGJvZHkgKz0gXCI8b2w+XCJcbiAgICAgICAgZGF0YS5PYmplY3RzLnNwbGl0KCcsJykuZm9yRWFjaChvYmogPT4ge1xuICAgICAgICAgICAgYm9keSArPSBcIjxsaT5cIlxuICAgICAgICAgICAgYm9keSArPSBcIjxoND5cIiArIG9iaiArIFwiPC9oND5cIlxuICAgICAgICAgICAgYm9keSArPSBcIjwvbGk+XCJcbiAgICAgICAgfSlcbiAgICAgICAgYm9keSArPSBcIjwvb2w+XCJcbiAgICB9IGVsc2Uge1xuICAgICAgICBib2R5ICs9ICc8aDQgY2xhc3M9XCJuby1vYmplY3RzXCI+S2VpbmUgT2JqZWt0ZTwvaDQ+J1xuICAgIH1cbiAgICBjb25zdCBidXR0b24gPSBcIjxidXR0b24gb25jbGljaz1cXFwiXCJcbiAgICArIFwiaGFuZGxlci5oYW5kbGVFZGl0QnV0dG9uUHJlc3NlZChcXCdlbnRyeV9pZF9cIiArIGRhdGEuRXZlbnRJZCArIFwiXFwnKVxcXCI+XCJcbiAgICArIFwibWVocjwvYnV0dG9uPlwiXG4gICAgXG4gICAgbGlzdEl0ZW0uaW5uZXJIVE1MID0gdGl0bGUgKyBib2R5ICsgYnV0dG9uXG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKVxufVxuXG4vLyB1cGRhdGUgdGhlIGVudHJ5IGxpc3Rcbi8vIGdldCBhbGwgaXRlbXMgZnJvbSBBUEkgYW5kIFxuLy8gYXBwZW5kIGVhY2ggb2YgdGhlbSB0byB0aGUgbGlzdFxuLy8gYWZ0ZXIgdGhhdCwgcmVjYWxjdWxhdGUgdGhlIHBhZ2VzXG5mdW5jdGlvbiB1cGRhdGVMaXN0ICgpIHtcbiAgICAvLyBlbXB0eSBvdXQgbGlzdFxuICAgIHZhciBsaXN0ID0gRE9NKCdsaXN0JylcbiAgICBsaXN0LmlubmVySFRNTCA9IFwiXCJcblxuICAgIGNvbnN0IGRhdGEgPSBmZXRjaChcIi9lbnRyeVwiKVxuICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxuICAgIH0pLnRoZW4oanNvbiA9PiB7XG4gICAgICAgIGpzb24uZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGFwcGVuZExpc3RJdGVtKGl0ZW0pXG4gICAgICAgIH0pXG4gICAgICAgIC8vIHJlY2FsY3VsYXRlIHBhZ2VzXG4gICAgICAgIHBhZ2VNYW5hZ2VyLmNoZWNrSGVpZ2h0KClcbiAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn1cblxuLy8gY2hlY2sgdGhlIGVkaXRvciBmaWVsZHMsIFxuLy8gcmV0dXJucyB0cnVlIGlmIGl0J3MgZ29vZCB0byBnbywgZWxzZSBmYWxzZVxuZnVuY3Rpb24gY2hlY2tGaWVsZHMgKCkge1xuICAgIHZhciBldmVyeXRoaW5nR29vZCA9IHRydWVcblxuICAgIC8vIGRhdGVcbiAgICBjb25zdCB5ZWFyID0gRE9NKCdlZGl0b3JfeWVhcicpLnZhbHVlXG4gICAgY29uc3QgbW9udGggPSBET00oJ2VkaXRvcl9tb250aCcpLnZhbHVlXG4gICAgY29uc3QgZGF5ID0gRE9NKCdlZGl0b3JfZGF5JykudmFsdWVcblxuICAgIGlmICh5ZWFyICE9IG51bGwgJiYgbW9udGggIT0gbnVsbCAmJiBkYXkgIT0gbnVsbCkge1xuICAgICAgICAvLyBwYWRkaW5nIHdpdGggMCdzXG4gICAgICAgIHZhciBtID0gbW9udGgudG9TdHJpbmcoKS5sZW5ndGggPCAyID8gXCIwXCIgKyBtb250aCA6IG1vbnRoXG4gICAgICAgIHZhciBkID0gZGF5LnRvU3RyaW5nKCkubGVuZ3RoIDwgMiA/IFwiMFwiICsgZGF5IDogZGF5XG5cbiAgICAgICAgdmFyIGRhdGV2YWwgPSBcIlwiXG4gICAgICAgIGRhdGV2YWwgKz0gXCJcIiArIHllYXJcbiAgICAgICAgZGF0ZXZhbCArPSBcIi1cIiArIG1cbiAgICAgICAgZGF0ZXZhbCArPSBcIi1cIiArIGRcblxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGRhdGV2YWwpXG4gICAgICAgIGNvbnN0IGlzRGF0ZSA9IGRhdGUudG9TdHJpbmcoKSAhPT0gXCJJbnZhbGlkIERhdGVcIlxuXG4gICAgICAgIGlmICghaXNEYXRlKSB7XG4gICAgICAgICAgICBET00oXCJlZGl0b3JfZGF5XCIpLmNsYXNzTGlzdC5hZGQoJ2Vycm9yLWZpZWxkJylcbiAgICAgICAgICAgIERPTShcImVkaXRvcl9tb250aFwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXG4gICAgICAgICAgICBET00oXCJlZGl0b3JfeWVhclwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXG4gICAgICAgICAgICBldmVyeXRoaW5nR29vZCA9IGZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgRE9NKFwiZWRpdG9yX2RheVwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXG4gICAgICAgIERPTShcImVkaXRvcl9tb250aFwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXG4gICAgICAgIERPTShcImVkaXRvcl95ZWFyXCIpLmNsYXNzTGlzdC5hZGQoJ2Vycm9yLWZpZWxkJylcbiAgICAgICAgZXZlcnl0aGluZ0dvb2QgPSBmYWxzZVxuICAgIH1cblxuICAgIC8vIHBsYWNlXG4gICAgLy8gb25seSBjaGVjayBpZiBpdHMgbm90IGVtcHR5XG4gICAgY29uc3QgbG9jdmFsID0gRE9NKFwiZWRpdG9yX3BsYWNlXCIpLnZhbHVlXG4gICAgaWYgKCFsb2N2YWwgfHwgbG9jdmFsID09PSBcIlwiKSB7XG4gICAgICAgIERPTShcImVkaXRvcl9wbGFjZVwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXG4gICAgICAgIGV2ZXJ5dGhpbmdHb29kID0gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gZXZlcnl0aGluZ0dvb2Rcbn1cblxuLy8gc2VuZCBwb3N0IHJlcXVlc3QgdXNpbmcgZmV0Y2ggcG9zdFxuLy8gYXN5bmNocm9uaW91cyBhd2FpdFxuYXN5bmMgZnVuY3Rpb24gcG9zdERhdGEgKGRhdGEpIHtcbiAgICAvLyBkYXRhIGlzIGEganNvbiBvYmplY3RcbiAgICBjb25zdCB1cmwgPSBcIi9hZGRfZXZlbnRcIjtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICAgIGhlYWRlcnM6IHtcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIn1cbiAgICB9KS50aGVuKHJlc3BvbnNlID0+IHsgXG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKClcbiAgICB9KS50aGVuKGpzb24gPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhqc29uKTtcbiAgICAgICAgdXBkYXRlTGlzdCgpXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSlcbn1cbi8vIHNlbmQgcG9zdCByZXF1ZXN0IHVzaW5nIGZldGNoIHB1dFxuLy8gYXN5bmNocm9uaW91cyBhd2FpdFxuYXN5bmMgZnVuY3Rpb24gcHV0RGF0YSAoZGF0YSkge1xuICAgIC8vIGRhdGEgaXMgYSBqc29uIG9iamVjdFxuICAgIGNvbnN0IHVybCA9IFwiL2VkaXRfZXZlbnRcIjtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdwdXQnLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgaGVhZGVyczoge1wiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwifVxuICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4geyBcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxuICAgIH0pLnRoZW4oanNvbiA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGpzb24pO1xuICAgICAgICB1cGRhdGVMaXN0KClcbiAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KVxuICAgXG59XG5cbi8vIHNlbmQgZGVsZXRlIHJlcXVlc3QgdXNpbmcgZmV0Y2ggZGVsZXRlXG4vLyBhc3luY2hyb25pb3VzIGF3YWl0XG5hc3luYyBmdW5jdGlvbiBkZWxldGVEYXRhIChpZCkge1xuICAgIGNvbnN0IHVybCA9IFwiL2RlbGV0ZVwiXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiAnZGVsZXRlJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe2lkOiBpZH0pLFxuICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6IFwiYXBwbGljYXRpb24vanNvblwifVxuICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXG4gICAgfSkudGhlbihqc29uID0+IHtcbiAgICAgICAgdXBkYXRlTGlzdCgpXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5sb2coZXJyb3IpKVxufVxuXG4vKiogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIG9uIGNsaWNrIGhhbmRsZXJzICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbnZhciBvYmpFeHBvcnQgPSB7XG5cbiAgICAvLyAnbWVocicgYnV0dG9uIGhhbmRsZXJzXG4gICAgLy8gZmlsbCB0aGUgZm9ybXMgaW4gdGhlIGVkaXRvclxuICAgIGhhbmRsZUVkaXRCdXR0b25QcmVzc2VkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVDYW5jZWxFZGl0UHJlc3NlZCh0cnVlKTtcblxuICAgICAgICAvLyBnZXQgdGhlIGluZm9cbiAgICAgICAgdmFyIGVsZW0gPSBET00oaWQpXG4gICAgICAgIGNvbnN0IG9iak51bSA9IGVsZW0uY2hpbGRyZW5bMV0uY2hpbGRFbGVtZW50Q291bnRcblxuICAgICAgICBjb25zdCBpbkRhdGUgPSBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTDtcbiAgICAgICAgY29uc3QgaW5QbGFjZSA9IGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMV0uaW5uZXJIVE1MO1xuXG4gICAgICAgIHRvZ2dsZUVkaXRvcklucHV0cyhmYWxzZSwgaW5EYXRlLCBpblBsYWNlKVxuXG4gICAgICAgIHZhciBvYmpzID0gRE9NKCdlZGl0b3Jfb2JqZWN0cycpO1xuXG4gICAgICAgIERPTSgnZWRpdG9yX2lkJykudmFsdWUgPSBcIlwiICsgaWQ7XG5cbiAgICAgICAgLy8gZGVsZXRlIGJ1dHRvblxuICAgICAgICBET00oJ2xvc19iJykuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgRE9NKCdsb3NfYicpLmNsYXNzTGlzdC5hZGQoXCJmYWRlLWluXCIpXG5cbiAgICAgICAgdmFyIGlucHV0cyA9IFwiXCI7XG4gICAgICAgIGNvbnN0IGlucCA9ICc8aW5wdXQgdHlwZT1cInRleHRcIic7XG5cbiAgICAgICAgaWYgKG9iak51bSA+IDApIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqTnVtOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gZWxlbS5jaGlsZHJlblsxXS5jaGlsZHJlbltpXS5jaGlsZHJlblswXS5pbm5lckhUTUw7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsID0gaW5wICsgJ3ZhbHVlPVwiJyArIHYgKydcIiBpZD1cImV2ZW50X29iaicrIChpICsxKSArICdcIj4nO1xuICAgICAgICAgICAgICAgIGlucHV0cyArPSB2YWw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9ianMuaW5uZXJIVE1MID0gaW5wdXRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2Jqcy5pbm5lckhUTUwgPSBpbnAgKyAnaWQ9XCJldmVudF9vYmoxXCI+JztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZWRpdE9iamVjdENvdW50ID0gb2JqTnVtO1xuICAgICAgICBcbiAgICB9LFxuXG4gICAgLy8gZWRpdG9yIGFkZCAxIG9iamVjdFxuICAgIC8vIHRvIGV2ZW50IG9iamVjdCBsaXN0XG4gICAgaGFuZGxlQWRkT2JqZWN0UHJlc3NlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IERPTSgnZWRpdG9yX29iamVjdHMnKS5jaGlsZHJlbi5sZW5ndGg7XG5cbiAgICAgICAgZWRpdE9iamVjdENvdW50Kys7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IGNoaWxkcmVuOyBpIDwgZWRpdE9iamVjdENvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKVxuICAgICAgICAgICAgaW5wdXQudHlwZSA9IFwidGV4dFwiXG4gICAgICAgICAgICBpbnB1dC5pZCA9IFwiZXZlbnRfb2JqXCIgKyAoaSsxKVxuICAgICAgICAgICAgRE9NKCdlZGl0b3Jfb2JqZWN0cycpLmFwcGVuZENoaWxkKGlucHV0KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIGVkaXRvciBkZWxldGUgMSBvYmplY3RcbiAgICAvLyBmcm9tIGV2ZW50IG9iamVjdCBsaXN0XG4gICAgaGFuZGxlRGVsZXRlT2JqZWN0UHJlc3NlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdE9iamVjdENvdW50ID09PSAxKSB7XG4gICAgICAgICAgICBET00oJ2VkaXRvcl9vYmplY3RzJykuY2hpbGROb2Rlc1swXS52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB2YXIgZXZlbnRzID0gRE9NKCdlZGl0b3Jfb2JqZWN0cycpO1xuICAgICAgICBjb25zdCBsYXN0Y2hpbGQgPSBldmVudHMuY2hpbGRyZW4ubGVuZ3RoIC0gMTtcbiAgICAgICAgZXZlbnRzLnJlbW92ZUNoaWxkKGV2ZW50cy5jaGlsZHJlbltsYXN0Y2hpbGRdKTtcbiAgICAgICAgZWRpdE9iamVjdENvdW50LS07XG4gICAgfSxcblxuICAgIC8vIGNoZWNrIGlmIHRoZSBmaWVsZHMgYXJlIHByb3Blcmx5IGZpbGxlZFxuICAgIC8vIHNlbmQgdGhlIHBvc3QgcmVxdWVzdFxuICAgIGhhbmRsZVNhdmVFZGl0UHJlc3NlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjaGVjayB0aGUgZmllbGRzXG4gICAgICAgIGlmICghY2hlY2tGaWVsZHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBkYXRlID0gXCJcIlxuICAgICAgICBkYXRlICs9IFwiXCIgKyBET00oJ2VkaXRvcl95ZWFyJykudmFsdWVcbiAgICAgICAgZGF0ZSArPSBcIi1cIiArIERPTSgnZWRpdG9yX21vbnRoJykudmFsdWVcbiAgICAgICAgZGF0ZSArPSBcIi1cIiArIERPTSgnZWRpdG9yX2RheScpLnZhbHVlXG4gICAgICAgIHZhciBwbGFjID0gRE9NKCdlZGl0b3JfcGxhY2UnKTtcbiAgICAgICAgdmFyIG9ianMgPSBET00oJ2VkaXRvcl9vYmplY3RzJykuY2hpbGROb2RlcztcbiAgICAgICAgY29uc3QgSUQgPSBET00oJ2VkaXRvcl9pZCcpLnZhbHVlLnNwbGl0KCdfJylbMl07XG4gICAgICAgIFxuICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgZXZlbnRfZGF0ZTogZGF0ZSxcbiAgICAgICAgICAgIGV2ZW50X2xvYzogcGxhYy52YWx1ZSxcbiAgICAgICAgICAgIGlkOiBJRFxuICAgICAgICB9XG4gICAgICAgIG9ianMuZm9yRWFjaChvYmogPT4ge1xuICAgICAgICAgICAgLy8gb25seSBhZGQgZmllbGQgb2JqZWN0c1xuICAgICAgICAgICAgaWYgKG9iai52YWx1ZSAmJiBvYmoudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBkYXRhW29iai5pZF0gPSBvYmoudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gcHV0IGRhdGFcbiAgICAgICAgLy8gaWYgdGhlIGlkIGlzIGVtcHR5LCB0aGVuIHBvc3QgZGF0YVxuICAgICAgICBpZiAoZGF0YS5pZCkge1xuICAgICAgICAgICAgcHV0RGF0YShkYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvc3REYXRhKGRhdGEpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaGFuZGxlQ2FuY2VsRWRpdFByZXNzZWQoKTtcbiAgICB9LFxuXG4gICAgLy8gc2V0IGluaXRpYWwgZWRpdG9yIHN0YXRlXG4gICAgaGFuZGxlQ2FuY2VsRWRpdFByZXNzZWQ6IGZ1bmN0aW9uIChub3RvZ2dsZT1mYWxzZSkge1xuICAgICAgICB2YXIgb2JqcyA9IERPTSgnZWRpdG9yX29iamVjdHMnKTtcbiAgICAgICAgb2Jqcy5pbm5lckhUTUwgPSBcIjxpbnB1dCB0eXBlPSd0ZXh0JyBkaXNhYmxlZD5cIjtcbiAgICAgICAgXG4gICAgICAgIERPTSgnZWRpdG9yX2lkJykudmFsdWUgPSBcIlwiO1xuXG4gICAgICAgIGlmICghbm90b2dnbGUpIHtcbiAgICAgICAgICAgIHRvZ2dsZUVkaXRvcklucHV0cyh0cnVlLCBcIlwiLCBcIlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVsZXRlIGJ1dHRvblxuICAgICAgICBET00oJ2xvc19iJykuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBET00oJ2xvc19iJykuY2xhc3NMaXN0LnJlbW92ZShcImZhZGUtaW5cIilcblxuICAgICAgICBET00oJ2VkaXRvcl9wbGFjZScpLmNsYXNzTGlzdC5yZW1vdmUoJ2Vycm9yLWZpZWxkJylcbiAgICAgICAgRE9NKCdlZGl0b3JfZGF5JykuY2xhc3NMaXN0LnJlbW92ZSgnZXJyb3ItZmllbGQnKVxuICAgICAgICBET00oJ2VkaXRvcl9tb250aCcpLmNsYXNzTGlzdC5yZW1vdmUoJ2Vycm9yLWZpZWxkJylcbiAgICAgICAgRE9NKCdlZGl0b3JfeWVhcicpLmNsYXNzTGlzdC5yZW1vdmUoJ2Vycm9yLWZpZWxkJylcblxuICAgIH0sXG5cbiAgICAvLyBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICBoYW5kbGVOZXdFbnRyeTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmhhbmRsZUNhbmNlbEVkaXRQcmVzc2VkKCk7XG4gICAgICAgIERPTSgnbG9zX2InKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIFxuICAgICAgICB2YXIgb2JqcyA9IERPTSgnZWRpdG9yX29iamVjdHMnKTtcbiAgICAgICAgXG4gICAgICAgIG9ianMuaW5uZXJIVE1MID0gJzxpbnB1dCB0eXBlPVwidGV4dFwiIGlkPVwiZXZlbnRfb2JqMVwiPic7XG4gICAgICAgIFxuICAgICAgICBET00oJ2VkaXRvcl9pZCcpLnZhbHVlID0gXCJcIjtcblxuICAgICAgICB0b2dnbGVFZGl0b3JJbnB1dHMoZmFsc2UsIFwiXCIsIFwiXCIpO1xuXG4gICAgICAgIGVkaXRPYmplY3RDb3VudCA9IDE7XG5cbiAgICB9LFxuXG4gICAgLy8gZGVsZXRlIGVudHJ5IGluIHRoZSBlZGl0b3JcbiAgICBoYW5kbGVEZWxldGVFbnRyeTogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBJRCA9IERPTSgnZWRpdG9yX2lkJykudmFsdWUuc3BsaXQoJ18nKVsyXTtcbiAgICAgICAgaWYgKElEKSB7XG4gICAgICAgICAgICBkZWxldGVEYXRhKElEKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFuZGxlQ2FuY2VsRWRpdFByZXNzZWQoKVxuICAgIH0sXG5cbiAgICBoYW5kbGVQYWdlQnV0dG9uOiBmdW5jdGlvbiAoaXNQbHVzKSB7XG4gICAgICAgIHBhZ2VNYW5hZ2VyLmhhbmRsZVBhZ2VCdXR0b24oaXNQbHVzKVxuICAgIH0sXG5cbiAgICAvLyBjaGVjayBmb3IgbWluIG1heCB2YWx1ZXMgZm9yIGRhdGVzXG4gICAgY2hlY2tNaW5NYXg6IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIGNvbnN0IG1heCA9IHBhcnNlSW50KGVsZW0ubWF4KVxuICAgICAgICBjb25zdCBtaW4gPSBwYXJzZUludChlbGVtLm1pbilcbiAgICAgICAgXG4gICAgICAgIGlmIChlbGVtLnZhbHVlIDw9IG1heCAmJiBlbGVtLnZhbHVlID49IG1pbikge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbS52YWx1ZSA8IG1pbikge1xuICAgICAgICAgICAgZWxlbS52YWx1ZSA9IG1pblxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChlbGVtLnZhbHVlID4gbWF4KSB7XG4gICAgICAgICAgICBlbGVtLnZhbHVlID0gbWF4XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvYmpFeHBvcnRcbiIsIi8vIGZpbGwgdGhlIHBhZ2UgZGljdGlvbmFyeVxudmFyIGN1cnJlbnRQYWdlO1xudmFyIHBhZ2VzO1xuZnVuY3Rpb24gZmlsbFBhZ2VzIChwYWdlTnVtLCBsYXN0SW5kZXgpIHtcbiAgICBwYWdlc1twYWdlTnVtXSA9IGxhc3RJbmRleFxufVxuXG4vLyBoaWRlIHRoZSBjb3JyZWN0IGl0ZW1zXG5mdW5jdGlvbiBoaWRlT3RoZXJQYWdlcyAoKSB7XG4gICAgY29uc3QgaXRlbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdCcpLmNoaWxkcmVuO1xuICAgIGNvbnN0IGl0ZW1zTnVtID0gaXRlbXMubGVuZ3RoO1xuXG4gICAgdmFyIGZpcnN0T2ZQYWdlID0gLTE7XG4gICAgdmFyIGxhc3RPZlBhZ2UgPSBwYWdlc1tjdXJyZW50UGFnZV07XG4gICAgXG4gICAgLy8gaWYgcHJldmlvdXMgcGFnZSBleGlzdHNcbiAgICBpZiAocGFnZXNbY3VycmVudFBhZ2UtMV0gIT0gbnVsbCkge1xuICAgICAgICBmaXJzdE9mUGFnZSA9IHBhZ2VzW2N1cnJlbnRQYWdlLTFdICsgMVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZpcnN0T2ZQYWdlID0gMDtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zTnVtOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPCBmaXJzdE9mUGFnZSB8fCBpID4gbGFzdE9mUGFnZSkge1xuICAgICAgICAgICAgaXRlbXNbaV0uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXRlbXNbaV0uc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gZGlzcGxheSBudW1iZXIgb2YgcGFnZXMgYW5kIGN1cnJlbnQgcGFnZVxuZnVuY3Rpb24gcGFnZVN0YXR1cyAoKSB7XG4gICAgdmFyIHN0YXR1cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlX3N0YXR1cycpO1xuICAgIHZhciBzaXplID0gMDtcbiAgICB2YXIga2V5O1xuICAgIGZvciAoa2V5IGluIHBhZ2VzKSB7XG4gICAgICAgIGlmIChwYWdlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBzaXplKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgdmFyIG1zZyA9IGN1cnJlbnRQYWdlICsgXCIgb2YgXCIgKyBzaXplO1xuICAgIHN0YXR1cy5pbm5lclRleHQgPSBtc2c7XG59XG5cbi8vIGRpc3BsYXkgdGhlIGl0ZW1zIHRoYXQgZml0IG9uIHRoZSB3aW5kb3csIHdpdGhvdXQgc2Nyb2xsaW5nXG5mdW5jdGlvbiBjaGVja0hlaWdodCAoKSB7XG4gICAgLy8gY2FsYyB0aGUgd2luZG93IGhlaWdodCB0byBmaXQgYSBtYXhpbWFsIGFtb3VudCBvZiBpdGVtc1xuICAgIGNvbnN0IHdpbkhlaSA9IHdpbmRvdy5pbm5lckhlaWdodCAtIDE0MDtcblxuICAgIGNvbnN0IGxpc3RJdGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0JykuY2hpbGRyZW47XG4gICAgY29uc3QgaXRlbXNOdW0gPSBsaXN0SXRlbXMubGVuZ3RoO1xuXG4gICAgdmFyIGl0ZW1zSGVpZ2h0ID0gMDtcbiAgICB2YXIgcGFnZU51bSA9IDE7XG4gICAgXG4gICAgY3VycmVudFBhZ2UgPSAxO1xuICAgIHBhZ2VzID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zTnVtOyBpKyspIHtcbiAgICAgICAgLy8gc2hvdyB0aGVtIGFsbCBhZ2FpbiwgdG8gYmUgbWVzc3VyZWRcbiAgICAgICAgbGlzdEl0ZW1zW2ldLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIHZhciBoID0gbGlzdEl0ZW1zW2ldLm9mZnNldEhlaWdodDtcbiAgICAgICAgaXRlbXNIZWlnaHQgKz0gaDtcbiAgICAgICAgXG4gICAgICAgIC8vIGlmIHRoZSBpdGVtcyBoZWlnaHQgaXMgYmlnZ2VyIHRoYW4gdGhlIHdpbmRvd1xuICAgICAgICAvLyB0aGVuIGFzaWduIHRoZW0gdG8gYSBkaWZmZXJlbnQgcGFnZVxuICAgICAgICBpZiAoaXRlbXNIZWlnaHQgPj0gd2luSGVpKSB7XG4gICAgICAgICAgICBmaWxsUGFnZXMocGFnZU51bSwgKGkgLSAxKSk7XG4gICAgICAgICAgICBpdGVtc0hlaWdodCA9IGg7XG4gICAgICAgICAgICBwYWdlTnVtKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGkgPT09IGl0ZW1zTnVtIC0gMSkge1xuICAgICAgICAgICAgZmlsbFBhZ2VzKHBhZ2VOdW0sIGkpO1xuICAgICAgICAgICAgcGFnZU51bSsrO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgLy8gaGlkZSBpdGVtcyBhZnRlciB0aGUgbGFzdCBpdGVtIG9mIHRoZSBwYWdlXG4gICAgaGlkZU90aGVyUGFnZXMoKTtcbiAgICAvLyBzaG93IG51bWJlciBvZiBwYWdlcyBhbmQgY3VycmVudCBvbmVcbiAgICBwYWdlU3RhdHVzKCk7XG4gICAgXG59XG4vLyBoYW5kbGUgYnV0dG9ucyBuZXh0IHBhZ2UgYW5kIHByZXZpb3VzIHBhZ2VcbmZ1bmN0aW9uIGhhbmRsZVBhZ2VCdXR0b24gKGlzUGx1cykge1xuICAgIFxuICAgIGlmIChpc1BsdXMpIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IGN1cnJlbnRQYWdlICsgMTtcblxuICAgICAgICBpZiAobmV4dCBpbiBwYWdlcykge1xuICAgICAgICAgICAgY3VycmVudFBhZ2UgPSBuZXh0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJldiA9IGN1cnJlbnRQYWdlIC0gMTtcblxuICAgICAgICBpZiAocHJldiBpbiBwYWdlcykge1xuICAgICAgICAgICAgY3VycmVudFBhZ2UgPSBwcmV2O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGlkZU90aGVyUGFnZXMoKTtcbiAgICBwYWdlU3RhdHVzKCk7XG59XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgY2hlY2tIZWlnaHQoKTtcbn1cblxudmFyIHJlc2l6ZXI7XG53aW5kb3cub25yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHJlc2l6ZXIpXG4gICAgIHJlc2l6ZXIgPSB0aGlzLnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjaGVja0hlaWdodCgpO1xuICAgIH0sIDIwMClcblxufVxuXG5leHBvcnRzLmNoZWNrSGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgIGNoZWNrSGVpZ2h0KClcbn1cblxuZXhwb3J0cy5oYW5kbGVQYWdlQnV0dG9uID0gZnVuY3Rpb24gKGlzUGx1cykge1xuICAgIGhhbmRsZVBhZ2VCdXR0b24oaXNQbHVzKVxufSBcbiJdfQ==
