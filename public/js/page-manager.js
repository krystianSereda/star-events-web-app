// fill the page dictionary
var currentPage = 1;
var pages;
function fillPages(pageNum, lastIndex){
    pages[pageNum] = lastIndex
}

// hide the correct items
function hideOtherPages(){
    const items = document.getElementById('list').children;
    const itemsNum = items.length;

    var firstOfPage = -1;
    var lastOfPage = pages[currentPage];
    if(pages[currentPage-1]){
        firstOfPage = pages[currentPage-1] + 1
    }
    else{
        firstOfPage = 0;
    }

    for(var i = 0; i < itemsNum; i++){
        if (i < firstOfPage || i >lastOfPage){
            items[i].style.display = "none";
        }
        else{
            items[i].style.display = "block";
        }
    }
}

// display number of pages and current page
function pageStatus(){
    var status = document.getElementById('page_status');
    var size = 0, key;
    for (key in pages) {
        if (pages.hasOwnProperty(key)){
            size++;
        }
    }
    
    var msg = currentPage + " of " + size;
    status.innerText = msg;
}


// display the items that fit on the window, without scrolling
function checkHeight(){
    var winHei = window.innerHeight;
    // the header has a height of 37px 
    // padding top in the list is 40px, margin is 10px
    winHei -= 100;

    const listItems = document.getElementById('list').children;
    const itemsNum = listItems.length;

    var itemsHeight = 0;
    var pageNum = 1;

    pages = {};
    for(var i = 0; i < itemsNum; i++){
        var h = listItems[i].offsetHeight;
        itemsHeight += h;
        
        // if the items height is bigger than the window
        // then asign them to a different page
        if( itemsHeight > winHei ){
            fillPages(pageNum, (i - 1));
            itemsHeight = h;
            pageNum++;
        }

    }

    // hide items after the last item of the page
    hideOtherPages();

    // show number of pages and current one
    pageStatus();
}
// handle buttons next page and previous page
function handlePageButton(isPlus){
    
    if(isPlus){
        const next = currentPage + 1;

        if(next in pages){
            
            currentPage = next;
        }
    }
    else{
        const prev = currentPage - 1;

        if(prev in pages){
            currentPage = prev;
        }
    }

    hideOtherPages();
    pageStatus();
}

window.onload = function (){

    checkHeight();
}
