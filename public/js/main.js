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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNvbXBpbGFibGVzL2pzL21haW4uanMiLCJjb21waWxhYmxlcy9qcy9wYWdlLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBwYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vcGFnZS1tYW5hZ2VyJylcclxuXHJcbnZhciBlZGl0T2JqZWN0Q291bnQgPSAxO1xyXG5cclxuLyoqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBmdW5jdGlvbnMgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbi8vIHJldHVybnMgdGhlIGVsZW1lbnQgKGxlc3MgcmVkdW5kYW5jeSlcclxuZnVuY3Rpb24gRE9NIChpZCkge1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxufVxyXG5cclxuLy8gZW5hYmxlIC8gZGlzYWJsZSB0aGUgZWRpdG9yIGlucHV0IGZpZWxkcywgYW5kIG9wdGlvbmFsbHlcclxuLy8gZmlsbCB0aGVtIHdpdGggYSBnaXZlbiB2YWx1ZVxyXG5mdW5jdGlvbiB0b2dnbGVFZGl0b3JJbnB1dHMgKGRpc2FibGUsIGluRGF0ZT1udWxsLCBpblBsYWNlPW51bGwpIHtcclxuICAgIHZhciBkYXkgPSBET00oJ2VkaXRvcl9kYXknKVxyXG4gICAgdmFyIG1vbnRoID0gRE9NKCdlZGl0b3JfbW9udGgnKVxyXG4gICAgdmFyIHllYXIgPSBET00oJ2VkaXRvcl95ZWFyJylcclxuXHJcbiAgICB2YXIgcGxhYyA9IERPTSgnZWRpdG9yX3BsYWNlJyk7XHJcbiAgICBpZiAoaW5EYXRlICE9PSBudWxsKSB7XHJcbiAgICAgICAgaWYgKGluRGF0ZSAhPT0gXCJcIikge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRlID0gaW5EYXRlLnNwbGl0KCctJylcclxuICAgICAgICAgICAgZGF5LnZhbHVlID0gcGFyc2VJbnQoZGF0ZVsyXSlcclxuICAgICAgICAgICAgbW9udGgudmFsdWUgPSBwYXJzZUludChkYXRlWzFdKVxyXG4gICAgICAgICAgICB5ZWFyLnZhbHVlID0gcGFyc2VJbnQoZGF0ZVswXSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkYXkudmFsdWUgPSBcIlwiXHJcbiAgICAgICAgICAgIG1vbnRoLnZhbHVlID0gXCJcIlxyXG4gICAgICAgICAgICB5ZWFyLnZhbHVlID0gXCJcIlxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChpblBsYWNlICE9IG51bGwpIHtcclxuICAgICAgICBwbGFjLnZhbHVlID0gaW5QbGFjZVxyXG4gICAgICAgIHBsYWMub25jaGFuZ2UoKVxyXG4gICAgfVxyXG5cclxuICAgIGRheS5kaXNhYmxlZCA9IGRpc2FibGU7XHJcbiAgICBtb250aC5kaXNhYmxlZCA9IGRpc2FibGU7XHJcbiAgICB5ZWFyLmRpc2FibGVkID0gZGlzYWJsZTtcclxuICAgIHBsYWMuZGlzYWJsZWQgPSBkaXNhYmxlO1xyXG4gICAgRE9NKCdhZGRfYicpLmRpc2FibGVkID0gZGlzYWJsZTtcclxuICAgIERPTSgnZGVsX2InKS5kaXNhYmxlZCA9IGRpc2FibGU7XHJcbiAgICBET00oJ2VuZF9iJykuZGlzYWJsZWQgPSBkaXNhYmxlO1xyXG4gICAgRE9NKCdjYW5fYicpLmRpc2FibGVkID0gZGlzYWJsZTtcclxuICAgIFxyXG59XHJcblxyXG4vLyBhcHBlbmQgYW4gZW50cnkgaXRlbSB0byB0aGUgZW50cnkgbGlzdFxyXG4vLyBnaXZlbiBhIGpzb24gZGF0YSBvYmplY3RcclxuZnVuY3Rpb24gYXBwZW5kTGlzdEl0ZW0gKGRhdGEpIHtcclxuICAgIHZhciBsaXN0ID0gRE9NKCdsaXN0JylcclxuICAgIHZhciBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxuICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoXCJmYWRlLWluXCIpXHJcbiAgICBsaXN0SXRlbS5pZCA9IFwiZW50cnlfaWRfXCIgKyBkYXRhLkV2ZW50SWRcclxuICAgIGNvbnN0IHRpdGxlID0gJzxkaXYgY2xhc3M9XCJlbnRyeS10aXRsZVwiPidcclxuICAgICAgICAgICAgICAgICAgICArJzxoMz4nICsgZGF0YS5FdmVudERhdGUgKyAnPC9oMz4nXHJcbiAgICAgICAgICAgICAgICAgICAgKyc8aDM+JyArIGRhdGEuRXZlbnRMb2MgKyAnPC9oMz4nXHJcbiAgICAgICAgICAgICAgICAgICAgKyc8L2Rpdj4nXHJcbiAgICB2YXIgYm9keSA9IFwiXCI7XHJcbiAgICBpZiAoZGF0YS5PYmplY3RzKSB7XHJcbiAgICAgICAgYm9keSArPSBcIjxvbD5cIlxyXG4gICAgICAgIGRhdGEuT2JqZWN0cy5zcGxpdCgnLCcpLmZvckVhY2gob2JqID0+IHtcclxuICAgICAgICAgICAgYm9keSArPSBcIjxsaT5cIlxyXG4gICAgICAgICAgICBib2R5ICs9IFwiPGg0PlwiICsgb2JqICsgXCI8L2g0PlwiXHJcbiAgICAgICAgICAgIGJvZHkgKz0gXCI8L2xpPlwiXHJcbiAgICAgICAgfSlcclxuICAgICAgICBib2R5ICs9IFwiPC9vbD5cIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib2R5ICs9ICc8aDQgY2xhc3M9XCJuby1vYmplY3RzXCI+S2VpbmUgT2JqZWt0ZTwvaDQ+J1xyXG4gICAgfVxyXG4gICAgY29uc3QgYnV0dG9uID0gXCI8YnV0dG9uIG9uY2xpY2s9XFxcIlwiXHJcbiAgICArIFwiaGFuZGxlci5oYW5kbGVFZGl0QnV0dG9uUHJlc3NlZChcXCdlbnRyeV9pZF9cIiArIGRhdGEuRXZlbnRJZCArIFwiXFwnKVxcXCI+XCJcclxuICAgICsgXCJtZWhyPC9idXR0b24+XCJcclxuICAgIFxyXG4gICAgbGlzdEl0ZW0uaW5uZXJIVE1MID0gdGl0bGUgKyBib2R5ICsgYnV0dG9uXHJcblxyXG4gICAgbGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSlcclxufVxyXG5cclxuLy8gdXBkYXRlIHRoZSBlbnRyeSBsaXN0XHJcbi8vIGdldCBhbGwgaXRlbXMgZnJvbSBBUEkgYW5kIFxyXG4vLyBhcHBlbmQgZWFjaCBvZiB0aGVtIHRvIHRoZSBsaXN0XHJcbi8vIGFmdGVyIHRoYXQsIHJlY2FsY3VsYXRlIHRoZSBwYWdlc1xyXG5mdW5jdGlvbiB1cGRhdGVMaXN0ICgpIHtcclxuICAgIC8vIGVtcHR5IG91dCBsaXN0XHJcbiAgICB2YXIgbGlzdCA9IERPTSgnbGlzdCcpXHJcbiAgICBsaXN0LmlubmVySFRNTCA9IFwiXCJcclxuXHJcbiAgICBjb25zdCBkYXRhID0gZmV0Y2goXCIvZW50cnlcIilcclxuICAgIC50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXHJcbiAgICB9KS50aGVuKGpzb24gPT4ge1xyXG4gICAgICAgIGpzb24uZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICAgICAgYXBwZW5kTGlzdEl0ZW0oaXRlbSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIC8vIHJlY2FsY3VsYXRlIHBhZ2VzXHJcbiAgICAgICAgcGFnZU1hbmFnZXIuY2hlY2tIZWlnaHQoKVxyXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyBjaGVjayB0aGUgZWRpdG9yIGZpZWxkcywgXHJcbi8vIHJldHVybnMgdHJ1ZSBpZiBpdCdzIGdvb2QgdG8gZ28sIGVsc2UgZmFsc2VcclxuZnVuY3Rpb24gY2hlY2tGaWVsZHMgKCkge1xyXG4gICAgdmFyIGV2ZXJ5dGhpbmdHb29kID0gdHJ1ZVxyXG5cclxuICAgIC8vIGRhdGVcclxuICAgIGNvbnN0IHllYXIgPSBET00oJ2VkaXRvcl95ZWFyJykudmFsdWVcclxuICAgIGNvbnN0IG1vbnRoID0gRE9NKCdlZGl0b3JfbW9udGgnKS52YWx1ZVxyXG4gICAgY29uc3QgZGF5ID0gRE9NKCdlZGl0b3JfZGF5JykudmFsdWVcclxuXHJcbiAgICBpZiAoeWVhciAhPSBudWxsICYmIG1vbnRoICE9IG51bGwgJiYgZGF5ICE9IG51bGwpIHtcclxuICAgICAgICAvLyBwYWRkaW5nIHdpdGggMCdzXHJcbiAgICAgICAgdmFyIG0gPSBtb250aC50b1N0cmluZygpLmxlbmd0aCA8IDIgPyBcIjBcIiArIG1vbnRoIDogbW9udGhcclxuICAgICAgICB2YXIgZCA9IGRheS50b1N0cmluZygpLmxlbmd0aCA8IDIgPyBcIjBcIiArIGRheSA6IGRheVxyXG5cclxuICAgICAgICB2YXIgZGF0ZXZhbCA9IFwiXCJcclxuICAgICAgICBkYXRldmFsICs9IFwiXCIgKyB5ZWFyXHJcbiAgICAgICAgZGF0ZXZhbCArPSBcIi1cIiArIG1cclxuICAgICAgICBkYXRldmFsICs9IFwiLVwiICsgZFxyXG5cclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGRhdGV2YWwpXHJcbiAgICAgICAgY29uc3QgaXNEYXRlID0gZGF0ZS50b1N0cmluZygpICE9PSBcIkludmFsaWQgRGF0ZVwiXHJcblxyXG4gICAgICAgIGlmICghaXNEYXRlKSB7XHJcbiAgICAgICAgICAgIERPTShcImVkaXRvcl9kYXlcIikuY2xhc3NMaXN0LmFkZCgnZXJyb3ItZmllbGQnKVxyXG4gICAgICAgICAgICBET00oXCJlZGl0b3JfbW9udGhcIikuY2xhc3NMaXN0LmFkZCgnZXJyb3ItZmllbGQnKVxyXG4gICAgICAgICAgICBET00oXCJlZGl0b3JfeWVhclwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXHJcbiAgICAgICAgICAgIGV2ZXJ5dGhpbmdHb29kID0gZmFsc2VcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgRE9NKFwiZWRpdG9yX2RheVwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXHJcbiAgICAgICAgRE9NKFwiZWRpdG9yX21vbnRoXCIpLmNsYXNzTGlzdC5hZGQoJ2Vycm9yLWZpZWxkJylcclxuICAgICAgICBET00oXCJlZGl0b3JfeWVhclwiKS5jbGFzc0xpc3QuYWRkKCdlcnJvci1maWVsZCcpXHJcbiAgICAgICAgZXZlcnl0aGluZ0dvb2QgPSBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHBsYWNlXHJcbiAgICAvLyBvbmx5IGNoZWNrIGlmIGl0cyBub3QgZW1wdHlcclxuICAgIGNvbnN0IGxvY3ZhbCA9IERPTShcImVkaXRvcl9wbGFjZVwiKS52YWx1ZVxyXG4gICAgaWYgKCFsb2N2YWwgfHwgbG9jdmFsID09PSBcIlwiKSB7XHJcbiAgICAgICAgRE9NKFwiZWRpdG9yX3BsYWNlXCIpLmNsYXNzTGlzdC5hZGQoJ2Vycm9yLWZpZWxkJylcclxuICAgICAgICBldmVyeXRoaW5nR29vZCA9IGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGV2ZXJ5dGhpbmdHb29kXHJcbn1cclxuXHJcbi8vIHNlbmQgcG9zdCByZXF1ZXN0IHVzaW5nIGZldGNoIHBvc3RcclxuLy8gYXN5bmNocm9uaW91cyBhd2FpdFxyXG5hc3luYyBmdW5jdGlvbiBwb3N0RGF0YSAoZGF0YSkge1xyXG4gICAgLy8gZGF0YSBpcyBhIGpzb24gb2JqZWN0XHJcbiAgICBjb25zdCB1cmwgPSBcIi9hZGRfZXZlbnRcIjtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgbWV0aG9kOiAncG9zdCcsXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXHJcbiAgICAgICAgaGVhZGVyczoge1wiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwifVxyXG4gICAgfSkudGhlbihyZXNwb25zZSA9PiB7IFxyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKClcclxuICAgIH0pLnRoZW4oanNvbiA9PiB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coanNvbik7XHJcbiAgICAgICAgdXBkYXRlTGlzdCgpXHJcbiAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgfSlcclxufVxyXG4vLyBzZW5kIHBvc3QgcmVxdWVzdCB1c2luZyBmZXRjaCBwdXRcclxuLy8gYXN5bmNocm9uaW91cyBhd2FpdFxyXG5hc3luYyBmdW5jdGlvbiBwdXREYXRhIChkYXRhKSB7XHJcbiAgICAvLyBkYXRhIGlzIGEganNvbiBvYmplY3RcclxuICAgIGNvbnN0IHVybCA9IFwiL2VkaXRfZXZlbnRcIjtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgbWV0aG9kOiAncHV0JyxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSxcclxuICAgICAgICBoZWFkZXJzOiB7XCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJ9XHJcbiAgICB9KS50aGVuKHJlc3BvbnNlID0+IHsgXHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxyXG4gICAgfSkudGhlbihqc29uID0+IHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhqc29uKTtcclxuICAgICAgICB1cGRhdGVMaXN0KClcclxuICAgIH0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICB9KVxyXG4gICBcclxufVxyXG5cclxuLy8gc2VuZCBkZWxldGUgcmVxdWVzdCB1c2luZyBmZXRjaCBkZWxldGVcclxuLy8gYXN5bmNocm9uaW91cyBhd2FpdFxyXG5hc3luYyBmdW5jdGlvbiBkZWxldGVEYXRhIChpZCkge1xyXG4gICAgY29uc3QgdXJsID0gXCIvZGVsZXRlXCJcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgbWV0aG9kOiAnZGVsZXRlJyxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7aWQ6IGlkfSksXHJcbiAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiBcImFwcGxpY2F0aW9uL2pzb25cIn1cclxuICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKClcclxuICAgIH0pLnRoZW4oanNvbiA9PiB7XHJcbiAgICAgICAgdXBkYXRlTGlzdCgpXHJcbiAgICB9KS5jYXRjaChlcnJvciA9PiBjb25zb2xlLmxvZyhlcnJvcikpXHJcbn1cclxuXHJcbi8qKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogb24gY2xpY2sgaGFuZGxlcnMgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbnZhciBvYmpFeHBvcnQgPSB7XHJcblxyXG4gICAgLy8gJ21laHInIGJ1dHRvbiBoYW5kbGVyc1xyXG4gICAgLy8gZmlsbCB0aGUgZm9ybXMgaW4gdGhlIGVkaXRvclxyXG4gICAgaGFuZGxlRWRpdEJ1dHRvblByZXNzZWQ6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHRoaXMuaGFuZGxlQ2FuY2VsRWRpdFByZXNzZWQodHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIGdldCB0aGUgaW5mb1xyXG4gICAgICAgIHZhciBlbGVtID0gRE9NKGlkKVxyXG4gICAgICAgIGNvbnN0IG9iak51bSA9IGVsZW0uY2hpbGRyZW5bMV0uY2hpbGRFbGVtZW50Q291bnRcclxuXHJcbiAgICAgICAgY29uc3QgaW5EYXRlID0gZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS5pbm5lckhUTUw7XHJcbiAgICAgICAgY29uc3QgaW5QbGFjZSA9IGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMV0uaW5uZXJIVE1MO1xyXG5cclxuICAgICAgICB0b2dnbGVFZGl0b3JJbnB1dHMoZmFsc2UsIGluRGF0ZSwgaW5QbGFjZSlcclxuXHJcbiAgICAgICAgdmFyIG9ianMgPSBET00oJ2VkaXRvcl9vYmplY3RzJyk7XHJcblxyXG4gICAgICAgIERPTSgnZWRpdG9yX2lkJykudmFsdWUgPSBcIlwiICsgaWQ7XHJcblxyXG4gICAgICAgIC8vIGRlbGV0ZSBidXR0b25cclxuICAgICAgICBET00oJ2xvc19iJykuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICBET00oJ2xvc19iJykuY2xhc3NMaXN0LmFkZChcImZhZGUtaW5cIilcclxuXHJcbiAgICAgICAgdmFyIGlucHV0cyA9IFwiXCI7XHJcbiAgICAgICAgY29uc3QgaW5wID0gJzxpbnB1dCB0eXBlPVwidGV4dFwiJztcclxuXHJcbiAgICAgICAgaWYgKG9iak51bSA+IDApIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpOdW07IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IGVsZW0uY2hpbGRyZW5bMV0uY2hpbGRyZW5baV0uY2hpbGRyZW5bMF0uaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsID0gaW5wICsgJ3ZhbHVlPVwiJyArIHYgKydcIiBpZD1cImV2ZW50X29iaicrIChpICsxKSArICdcIj4nO1xyXG4gICAgICAgICAgICAgICAgaW5wdXRzICs9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgb2Jqcy5pbm5lckhUTUwgPSBpbnB1dHM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb2Jqcy5pbm5lckhUTUwgPSBpbnAgKyAnaWQ9XCJldmVudF9vYmoxXCI+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWRpdE9iamVjdENvdW50ID0gb2JqTnVtO1xyXG4gICAgICAgIFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBlZGl0b3IgYWRkIDEgb2JqZWN0XHJcbiAgICAvLyB0byBldmVudCBvYmplY3QgbGlzdFxyXG4gICAgaGFuZGxlQWRkT2JqZWN0UHJlc3NlZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gRE9NKCdlZGl0b3Jfb2JqZWN0cycpLmNoaWxkcmVuLmxlbmd0aDtcclxuXHJcbiAgICAgICAgZWRpdE9iamVjdENvdW50Kys7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSBjaGlsZHJlbjsgaSA8IGVkaXRPYmplY3RDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKVxyXG4gICAgICAgICAgICBpbnB1dC50eXBlID0gXCJ0ZXh0XCJcclxuICAgICAgICAgICAgaW5wdXQuaWQgPSBcImV2ZW50X29ialwiICsgKGkrMSlcclxuICAgICAgICAgICAgRE9NKCdlZGl0b3Jfb2JqZWN0cycpLmFwcGVuZENoaWxkKGlucHV0KVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gZWRpdG9yIGRlbGV0ZSAxIG9iamVjdFxyXG4gICAgLy8gZnJvbSBldmVudCBvYmplY3QgbGlzdFxyXG4gICAgaGFuZGxlRGVsZXRlT2JqZWN0UHJlc3NlZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmIChlZGl0T2JqZWN0Q291bnQgPT09IDEpIHtcclxuICAgICAgICAgICAgRE9NKCdlZGl0b3Jfb2JqZWN0cycpLmNoaWxkTm9kZXNbMF0udmFsdWUgPSBcIlwiO1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGV2ZW50cyA9IERPTSgnZWRpdG9yX29iamVjdHMnKTtcclxuICAgICAgICBjb25zdCBsYXN0Y2hpbGQgPSBldmVudHMuY2hpbGRyZW4ubGVuZ3RoIC0gMTtcclxuICAgICAgICBldmVudHMucmVtb3ZlQ2hpbGQoZXZlbnRzLmNoaWxkcmVuW2xhc3RjaGlsZF0pO1xyXG4gICAgICAgIGVkaXRPYmplY3RDb3VudC0tO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBjaGVjayBpZiB0aGUgZmllbGRzIGFyZSBwcm9wZXJseSBmaWxsZWRcclxuICAgIC8vIHNlbmQgdGhlIHBvc3QgcmVxdWVzdFxyXG4gICAgaGFuZGxlU2F2ZUVkaXRQcmVzc2VkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gY2hlY2sgdGhlIGZpZWxkc1xyXG4gICAgICAgIGlmICghY2hlY2tGaWVsZHMoKSkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRhdGUgPSBcIlwiXHJcbiAgICAgICAgZGF0ZSArPSBcIlwiICsgRE9NKCdlZGl0b3JfeWVhcicpLnZhbHVlXHJcbiAgICAgICAgZGF0ZSArPSBcIi1cIiArIERPTSgnZWRpdG9yX21vbnRoJykudmFsdWVcclxuICAgICAgICBkYXRlICs9IFwiLVwiICsgRE9NKCdlZGl0b3JfZGF5JykudmFsdWVcclxuICAgICAgICB2YXIgcGxhYyA9IERPTSgnZWRpdG9yX3BsYWNlJyk7XHJcbiAgICAgICAgdmFyIG9ianMgPSBET00oJ2VkaXRvcl9vYmplY3RzJykuY2hpbGROb2RlcztcclxuICAgICAgICBjb25zdCBJRCA9IERPTSgnZWRpdG9yX2lkJykudmFsdWUuc3BsaXQoJ18nKVsyXTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgICAgICBldmVudF9kYXRlOiBkYXRlLFxyXG4gICAgICAgICAgICBldmVudF9sb2M6IHBsYWMudmFsdWUsXHJcbiAgICAgICAgICAgIGlkOiBJRFxyXG4gICAgICAgIH1cclxuICAgICAgICBvYmpzLmZvckVhY2gob2JqID0+IHtcclxuICAgICAgICAgICAgLy8gb25seSBhZGQgZmllbGQgb2JqZWN0c1xyXG4gICAgICAgICAgICBpZiAob2JqLnZhbHVlICYmIG9iai52YWx1ZSAhPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgZGF0YVtvYmouaWRdID0gb2JqLnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLy8gcHV0IGRhdGFcclxuICAgICAgICAvLyBpZiB0aGUgaWQgaXMgZW1wdHksIHRoZW4gcG9zdCBkYXRhXHJcbiAgICAgICAgaWYgKGRhdGEuaWQpIHtcclxuICAgICAgICAgICAgcHV0RGF0YShkYXRhKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwb3N0RGF0YShkYXRhKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmhhbmRsZUNhbmNlbEVkaXRQcmVzc2VkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHNldCBpbml0aWFsIGVkaXRvciBzdGF0ZVxyXG4gICAgaGFuZGxlQ2FuY2VsRWRpdFByZXNzZWQ6IGZ1bmN0aW9uIChub3RvZ2dsZT1mYWxzZSkge1xyXG4gICAgICAgIHZhciBvYmpzID0gRE9NKCdlZGl0b3Jfb2JqZWN0cycpO1xyXG4gICAgICAgIG9ianMuaW5uZXJIVE1MID0gXCI8aW5wdXQgdHlwZT0ndGV4dCcgZGlzYWJsZWQ+XCI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgRE9NKCdlZGl0b3JfaWQnKS52YWx1ZSA9IFwiXCI7XHJcblxyXG4gICAgICAgIGlmICghbm90b2dnbGUpIHtcclxuICAgICAgICAgICAgdG9nZ2xlRWRpdG9ySW5wdXRzKHRydWUsIFwiXCIsIFwiXCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBkZWxldGUgYnV0dG9uXHJcbiAgICAgICAgRE9NKCdsb3NfYicpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICBET00oJ2xvc19iJykuY2xhc3NMaXN0LnJlbW92ZShcImZhZGUtaW5cIilcclxuXHJcbiAgICAgICAgRE9NKCdlZGl0b3JfcGxhY2UnKS5jbGFzc0xpc3QucmVtb3ZlKCdlcnJvci1maWVsZCcpXHJcbiAgICAgICAgRE9NKCdlZGl0b3JfZGF5JykuY2xhc3NMaXN0LnJlbW92ZSgnZXJyb3ItZmllbGQnKVxyXG4gICAgICAgIERPTSgnZWRpdG9yX21vbnRoJykuY2xhc3NMaXN0LnJlbW92ZSgnZXJyb3ItZmllbGQnKVxyXG4gICAgICAgIERPTSgnZWRpdG9yX3llYXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlcnJvci1maWVsZCcpXHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBjcmVhdGUgYSBuZXcgZW50cnlcclxuICAgIGhhbmRsZU5ld0VudHJ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5oYW5kbGVDYW5jZWxFZGl0UHJlc3NlZCgpO1xyXG4gICAgICAgIERPTSgnbG9zX2InKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG9ianMgPSBET00oJ2VkaXRvcl9vYmplY3RzJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgb2Jqcy5pbm5lckhUTUwgPSAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgaWQ9XCJldmVudF9vYmoxXCI+JztcclxuICAgICAgICBcclxuICAgICAgICBET00oJ2VkaXRvcl9pZCcpLnZhbHVlID0gXCJcIjtcclxuXHJcbiAgICAgICAgdG9nZ2xlRWRpdG9ySW5wdXRzKGZhbHNlLCBcIlwiLCBcIlwiKTtcclxuXHJcbiAgICAgICAgZWRpdE9iamVjdENvdW50ID0gMTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIGRlbGV0ZSBlbnRyeSBpbiB0aGUgZWRpdG9yXHJcbiAgICBoYW5kbGVEZWxldGVFbnRyeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IElEID0gRE9NKCdlZGl0b3JfaWQnKS52YWx1ZS5zcGxpdCgnXycpWzJdO1xyXG4gICAgICAgIGlmIChJRCkge1xyXG4gICAgICAgICAgICBkZWxldGVEYXRhKElEKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmhhbmRsZUNhbmNlbEVkaXRQcmVzc2VkKClcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlUGFnZUJ1dHRvbjogZnVuY3Rpb24gKGlzUGx1cykge1xyXG4gICAgICAgIHBhZ2VNYW5hZ2VyLmhhbmRsZVBhZ2VCdXR0b24oaXNQbHVzKVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBjaGVjayBmb3IgbWluIG1heCB2YWx1ZXMgZm9yIGRhdGVzXHJcbiAgICBjaGVja01pbk1heDogZnVuY3Rpb24gKGVsZW0pIHtcclxuICAgICAgICBjb25zdCBtYXggPSBwYXJzZUludChlbGVtLm1heClcclxuICAgICAgICBjb25zdCBtaW4gPSBwYXJzZUludChlbGVtLm1pbilcclxuICAgICAgICBcclxuICAgICAgICBpZiAoZWxlbS52YWx1ZSA8PSBtYXggJiYgZWxlbS52YWx1ZSA+PSBtaW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZWxlbS52YWx1ZSA8IG1pbikge1xyXG4gICAgICAgICAgICBlbGVtLnZhbHVlID0gbWluXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoZWxlbS52YWx1ZSA+IG1heCkge1xyXG4gICAgICAgICAgICBlbGVtLnZhbHVlID0gbWF4XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBvYmpFeHBvcnRcclxuIiwiLy8gZmlsbCB0aGUgcGFnZSBkaWN0aW9uYXJ5XHJcbnZhciBjdXJyZW50UGFnZTtcclxudmFyIHBhZ2VzO1xyXG5mdW5jdGlvbiBmaWxsUGFnZXMgKHBhZ2VOdW0sIGxhc3RJbmRleCkge1xyXG4gICAgcGFnZXNbcGFnZU51bV0gPSBsYXN0SW5kZXhcclxufVxyXG5cclxuLy8gaGlkZSB0aGUgY29ycmVjdCBpdGVtc1xyXG5mdW5jdGlvbiBoaWRlT3RoZXJQYWdlcyAoKSB7XHJcbiAgICBjb25zdCBpdGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0JykuY2hpbGRyZW47XHJcbiAgICBjb25zdCBpdGVtc051bSA9IGl0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICB2YXIgZmlyc3RPZlBhZ2UgPSAtMTtcclxuICAgIHZhciBsYXN0T2ZQYWdlID0gcGFnZXNbY3VycmVudFBhZ2VdO1xyXG4gICAgXHJcbiAgICAvLyBpZiBwcmV2aW91cyBwYWdlIGV4aXN0c1xyXG4gICAgaWYgKHBhZ2VzW2N1cnJlbnRQYWdlLTFdICE9IG51bGwpIHtcclxuICAgICAgICBmaXJzdE9mUGFnZSA9IHBhZ2VzW2N1cnJlbnRQYWdlLTFdICsgMVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBmaXJzdE9mUGFnZSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtc051bTsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGkgPCBmaXJzdE9mUGFnZSB8fCBpID4gbGFzdE9mUGFnZSkge1xyXG4gICAgICAgICAgICBpdGVtc1tpXS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaXRlbXNbaV0uc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIGRpc3BsYXkgbnVtYmVyIG9mIHBhZ2VzIGFuZCBjdXJyZW50IHBhZ2VcclxuZnVuY3Rpb24gcGFnZVN0YXR1cyAoKSB7XHJcbiAgICB2YXIgc3RhdHVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2Vfc3RhdHVzJyk7XHJcbiAgICB2YXIgc2l6ZSA9IDA7XHJcbiAgICB2YXIga2V5O1xyXG4gICAgZm9yIChrZXkgaW4gcGFnZXMpIHtcclxuICAgICAgICBpZiAocGFnZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICBzaXplKys7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbXNnID0gY3VycmVudFBhZ2UgKyBcIiBvZiBcIiArIHNpemU7XHJcbiAgICBzdGF0dXMuaW5uZXJUZXh0ID0gbXNnO1xyXG59XHJcblxyXG4vLyBkaXNwbGF5IHRoZSBpdGVtcyB0aGF0IGZpdCBvbiB0aGUgd2luZG93LCB3aXRob3V0IHNjcm9sbGluZ1xyXG5mdW5jdGlvbiBjaGVja0hlaWdodCAoKSB7XHJcbiAgICAvLyBjYWxjIHRoZSB3aW5kb3cgaGVpZ2h0IHRvIGZpdCBhIG1heGltYWwgYW1vdW50IG9mIGl0ZW1zXHJcbiAgICBjb25zdCB3aW5IZWkgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSAxNDA7XHJcblxyXG4gICAgY29uc3QgbGlzdEl0ZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3QnKS5jaGlsZHJlbjtcclxuICAgIGNvbnN0IGl0ZW1zTnVtID0gbGlzdEl0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICB2YXIgaXRlbXNIZWlnaHQgPSAwO1xyXG4gICAgdmFyIHBhZ2VOdW0gPSAxO1xyXG4gICAgXHJcbiAgICBjdXJyZW50UGFnZSA9IDE7XHJcbiAgICBwYWdlcyA9IHt9O1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXNOdW07IGkrKykge1xyXG4gICAgICAgIC8vIHNob3cgdGhlbSBhbGwgYWdhaW4sIHRvIGJlIG1lc3N1cmVkXHJcbiAgICAgICAgbGlzdEl0ZW1zW2ldLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgdmFyIGggPSBsaXN0SXRlbXNbaV0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgIGl0ZW1zSGVpZ2h0ICs9IGg7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gaWYgdGhlIGl0ZW1zIGhlaWdodCBpcyBiaWdnZXIgdGhhbiB0aGUgd2luZG93XHJcbiAgICAgICAgLy8gdGhlbiBhc2lnbiB0aGVtIHRvIGEgZGlmZmVyZW50IHBhZ2VcclxuICAgICAgICBpZiAoaXRlbXNIZWlnaHQgPj0gd2luSGVpKSB7XHJcbiAgICAgICAgICAgIGZpbGxQYWdlcyhwYWdlTnVtLCAoaSAtIDEpKTtcclxuICAgICAgICAgICAgaXRlbXNIZWlnaHQgPSBoO1xyXG4gICAgICAgICAgICBwYWdlTnVtKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpID09PSBpdGVtc051bSAtIDEpIHtcclxuICAgICAgICAgICAgZmlsbFBhZ2VzKHBhZ2VOdW0sIGkpO1xyXG4gICAgICAgICAgICBwYWdlTnVtKys7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuICAgIC8vIGhpZGUgaXRlbXMgYWZ0ZXIgdGhlIGxhc3QgaXRlbSBvZiB0aGUgcGFnZVxyXG4gICAgaGlkZU90aGVyUGFnZXMoKTtcclxuICAgIC8vIHNob3cgbnVtYmVyIG9mIHBhZ2VzIGFuZCBjdXJyZW50IG9uZVxyXG4gICAgcGFnZVN0YXR1cygpO1xyXG4gICAgXHJcbn1cclxuLy8gaGFuZGxlIGJ1dHRvbnMgbmV4dCBwYWdlIGFuZCBwcmV2aW91cyBwYWdlXHJcbmZ1bmN0aW9uIGhhbmRsZVBhZ2VCdXR0b24gKGlzUGx1cykge1xyXG4gICAgXHJcbiAgICBpZiAoaXNQbHVzKSB7XHJcbiAgICAgICAgY29uc3QgbmV4dCA9IGN1cnJlbnRQYWdlICsgMTtcclxuXHJcbiAgICAgICAgaWYgKG5leHQgaW4gcGFnZXMpIHtcclxuICAgICAgICAgICAgY3VycmVudFBhZ2UgPSBuZXh0O1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcHJldiA9IGN1cnJlbnRQYWdlIC0gMTtcclxuXHJcbiAgICAgICAgaWYgKHByZXYgaW4gcGFnZXMpIHtcclxuICAgICAgICAgICAgY3VycmVudFBhZ2UgPSBwcmV2O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBoaWRlT3RoZXJQYWdlcygpO1xyXG4gICAgcGFnZVN0YXR1cygpO1xyXG59XHJcblxyXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY2hlY2tIZWlnaHQoKTtcclxufVxyXG5cclxudmFyIHJlc2l6ZXI7XHJcbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGNsZWFyVGltZW91dChyZXNpemVyKVxyXG4gICAgIHJlc2l6ZXIgPSB0aGlzLnNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGNoZWNrSGVpZ2h0KCk7XHJcbiAgICB9LCAyMDApXHJcblxyXG59XHJcblxyXG5leHBvcnRzLmNoZWNrSGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY2hlY2tIZWlnaHQoKVxyXG59XHJcblxyXG5leHBvcnRzLmhhbmRsZVBhZ2VCdXR0b24gPSBmdW5jdGlvbiAoaXNQbHVzKSB7XHJcbiAgICBoYW5kbGVQYWdlQnV0dG9uKGlzUGx1cylcclxufSBcclxuIl19
