/*
All code in this file written by Caden O'Kellylee @Cesium72.
Don't steal my code!
*/
async function send(form,value) {
    document.getElementById(form).innerHTML = "";
    await fetch(`send/${form}/${value}/${localStorage.getItem("uid")}`);
    fetch("view/"+form)
        .then(response => response.text())
        .then(txt => {document.getElementById(form).innerHTML = txt});
}

async function init() {
    document.getElementsByTagName("main")[0].innerHTML = await (await fetch(`list/${localStorage.getItem("uid")}`)).text();
    let ad = JSON.parse(decodeURIComponent(await (await fetch('viewAd')).text()));
    document.getElementById("adBox").innerHTML = `<a href="${ad.clickURL}"target="_blank"><img src="${ad.imgURL}"/></a>`;
}
init();

document.getElementById("name").textContent = localStorage.getItem("name");

(async () => {if(!localStorage.uid)
    document.write(await (await fetch('newuser')).text());})();
