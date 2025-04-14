import { greenMarkers, blueMarkers, yellowMarkers } from "./Content1";

function allTagsFound(allTags, filters) {
    if (allTags === null){
        return false;
    }
    else { 
    allTags = allTags.toLowerCase();
    for (const filter of filters) {
      if (allTags.indexOf(filter.toLowerCase()) === -1) {
        return false;
      }
    }
    return true;
    }
};
  

function filterCategory(category){
    if (category == "River") {
        // hide watersheds
        let watersheds = document.getElementsByClassName("green-marker");
        for (let i =0; i < watersheds.length; i++) watersheds[i].style.visibility = "hidden";

        // hide places
        let places = document.getElementsByClassName("yellow-marker");
        for (let i =0; i < places.length; i++) places[i].style.visibility = "hidden";
    }
    else if (category == "Watershed") {
        // hide rivers
        let rivers = document.getElementsByClassName("blue-marker");
        for (let i =0; i < rivers.length; i++) rivers[i].style.visibility = "hidden";

        // hide places
        let places = document.getElementsByClassName("yellow-marker");
        for (let i =0; i < places.length; i++) places[i].style.visibility = "hidden";
    }
    else if (category == "Places") {
        // hide watersheds
        let watersheds = document.getElementsByClassName("green-marker");
        for (let i =0; i < watersheds.length; i++) watersheds[i].style.visibility = "hidden";

        // hide rivers
        let rivers = document.getElementsByClassName("blue-marker");
        for (let i =0; i < rivers.length; i++) rivers[i].style.visibility = "hidden";
    }
}

function filterTag(tag){
    let substrings = tag.split(",");
    let rivers = document.getElementsByClassName("blue-marker");
    let watersheds = document.getElementsByClassName("green-marker");
    let places = document.getElementsByClassName("yellow-marker");

    for (let i = 0; i < rivers.length; i++) {
        if (allTagsFound(blueMarkers[i][1], substrings))
        {
            rivers[i].style.visibility = "visible";
        }
        else {
            rivers[i].style.visibility = "hidden";
        }
    
    }
    for (let i = 0; i < watersheds.length; i++) {
        if (allTagsFound(greenMarkers[i][1], substrings)){
            watersheds[i].style.visibility = "visible";
        }
        else{
            watersheds[i].style.visibility = "hidden";
        }
    }
    for (let i = 0; i < places.length; i++) {
        if (allTagsFound(yellowMarkers[i][1], substrings)){
            places[i].style.visibility = "visible";
        }
        else {
            places[i].style.visibility = "hidden";
        }
    }
}

function filterCategoryAndTag(category, tag) {
    if (!category || !tag || typeof tag !== 'string') {
        console.warn("⚠️ Invalid category/tag in filterCategoryAndTag:", category, tag);
        showAll();
        return;
    }
    let substrings = tag.split(",");
    filterCategory(category);
      
    if (category == "River"){
        let rivers = document.getElementsByClassName("blue-marker");
        for (let i = 0; i < blueMarkers.length; i++) {
            if (allTagsFound(blueMarkers[i][1], substrings))
            {
                rivers[i].style.visibility = "visible";
            }
            else {
                rivers[i].style.visibility = "hidden";
            }
        }
    }
    else if (category == "Watershed"){
        let watersheds = document.getElementsByClassName("green-marker");
        for (let i = 0; i < greenMarkers.length; i++) {
            if (allTagsFound(greenMarkers[i][1], substrings)){
                watersheds[i].style.visibility = "visible";
            }
            else{
                watersheds[i].style.visibility = "hidden";
            }
        }
    }
    // places
    else if (category=="Places") {
        let places = document.getElementsByClassName("yellow-marker");
        for (let i = 0; i < yellowMarkers.length; i++) {
            if (allTagsFound(yellowMarkers[i][1], substrings)){
                places[i].style.visibility = "visible";
            }
            else {
                places[i].style.visibility = "hidden";
            }
        }
    }

    
      const categories = category.split(',');
      const tags = tag.split(',');
}

function showAll() {
    let rivers = document.getElementsByClassName("blue-marker");
    let watersheds = document.getElementsByClassName("green-marker");
    let places = document.getElementsByClassName("yellow-marker");

    for (let i = 0; i < rivers.length; i++) {
        rivers[i].style.visibility = "visible";
    }
    for (let i = 0; i < watersheds.length; i++) {
        watersheds[i].style.visibility = "visible";
    }
    for (let i = 0; i < places.length; i++) {
        places[i].style.visibility = "visible";
    }
}

export {showAll, filterCategory, filterTag, filterCategoryAndTag};