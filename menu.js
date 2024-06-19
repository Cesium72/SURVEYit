/*
All code in this file written by Caden O'Kellylee @Cesium72.
Don't steal my code!
*/
var menuVisible = false;
const shade = document.getElementById("shade");
const menu = document.getElementById("menu");
function changeMenu() {
  if(menuVisible == false) {
    shade.style.display = "block";
    menu.className = "visible";
  } else {
      shade.style.display = "none";
      menu.className = "";
  }
  menuVisible = !menuVisible;
}

(async () => {if(!localStorage.uid)
    document.write(await (await fetch('newuser')).text());})();
