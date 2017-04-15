function loadJSON(url, callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", url, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
}

function onLoadJSON(data) {
    file = JSON.parse(data);
    questions = file.questions;
    console.log("PREGUNTAS CARGADAS DE DISCO:", questions);
    index = questions.length-1;
    
    saveToLocalStorage();
    printCurrentQuestion();
    initButtons();
}

function initButtons() {
    document.getElementById("form").onsubmit = onSubmit;
    document.getElementById("prev").onclick = prevItem;
    document.getElementById("next").onclick = nextItem;
    document.getElementById("load").onclick = cleanLoad;
    document.getElementById("save").onclick = saveToLocalStorage;
    inputs.forEach(function (item, i) {
        console.log(item, i);
        item.onchange = saveToRam;
    });
}

function nextItem() {
    if (++index > questions.length-1) {
        if (questions[index-1].text != "") {
            newItem();
        } else {
            index--;
        }
    }
    printCurrentQuestion();
}

function newItem() {
    var newItem = {};
    newItem.text = "";
    newItem.answers = ["", "", "", ""];
    newItem.category = 0;
    questions.push(newItem);
}

function prevItem() {
    if (--index < 0) {
        index = 0;
    }
    printCurrentQuestion();
}

function onSubmit(ev) {
    console.log(ev);
    ev.preventDefault();
    var output = {};
    output.questions = questions;
    msg.value = JSON.stringify(output);
    msg.style.display = "block";
}

function printCurrentQuestion() {
    msg.style.display = "none";
    idx.value = index;
    var q = questions[index];
    cat.value = q.category;
    text.value = q.text;
    answer0.value = q.answers[0];
    answer1.value = q.answers[1];
    answer2.value = q.answers[2];
    answer3.value = q.answers[3];
    setCategoryColor();
}

function saveToLocalStorage() {
    msg.style.display = "none";
    file = {};
    file.questions = questions;
    localStorage.setItem("preguntas", JSON.stringify(file));
    console.log("GUARDANDO EN MEMORIA:", file.questions);
}

function saveToRam() {
    msg.style.display = "none";
    console.log("GUARDANDO EN RAM");
    inputs.forEach(function (item, i) {
        if (item.id == "text" || item.id == "category") {
            if (!isNaN(parseInt(item.value))) {
                questions[index][item.id] = parseInt(item.value);
                setCategoryColor();
            } else {
                questions[index][item.id] = item.value;
            }
        } else {
            var id = item.id.substring(6);
            questions[index].answers[id] = item.value;
        }
    });
}

/*
Libro - "Últimas noticias" - ROJO -> "Ratón de biblioteca"
- Historia
- Literatura
- Cómics

Globo terráqueo y Letras - "Escenario y pantalla" - VERDE -> "Pegado a la pantalla"
- Televisión / publicidad
- Cine
- Artistas

Tubo ensayo y Araña - "Gente y recuerdos" - NARANJA -> "Todo el mundo es bueno" / "La gente es gente" / "¡Que viva la gente!"
- Música
- Sociedad ¿?
- Personajes públicos

Caretas teatro y Bate béisbol - "Días de colegio" - AZUL - > "Yo no fui a EGB"
- "Ciencias sociales" / Políticas, el himno de un país ¿?
- Geografía
- Ciencias naturales / biología
- Invenciones
- Religión / biblia
- Cultura general...
*/

function setCategoryColor() {
    var catCols = ["red", "green", "orange", "blue"];
    text.style.backgroundColor =  catCols[cat.value] || "grey";
}

function init() {
    var ls = localStorage.getItem("preguntas");
    if (!ls) {
        loadJSON("preguntas.json", onLoadJSON);
    } else {
        file = JSON.parse(ls);
        console.log("CARGANDO DE MEMORIA (OBVIANDO DISCO):", file.questions);
        questions = file.questions;
        index = questions.length-1;
        printCurrentQuestion();
        initButtons();
    }
}

function cleanLoad() {
    msg.style.display = "none";
    loadJSON("preguntas.json", onLoadJSON);
}

var questions, file, msg = document.getElementById("result");
var index = 0, text = document.getElementById("text"), cat = document.getElementById("category"),
    answer0 = document.getElementById("answer0"), answer1 = document.getElementById("answer1"),
    answer2 = document.getElementById("answer2"), answer3 = document.getElementById("answer3"),
    idx = document.getElementById("index");
var inputs = [text, cat, answer0, answer1, answer2, answer3];

init();