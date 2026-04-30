
//=================================================================================================================================================================
// GESTION DES VARIABLES
//=================================================================================================================================================================

// FONCTION POUR SAUVEGARDER UNE VARIABLE DANS LE LOCALSTORAGE --------------------------------------------------------------------------------------------------------------
function sauvegarder(cle, donnees) { //cle = nom du stockage, donnees = variable à stocker
    localStorage.setItem(cle, JSON.stringify(donnees));
}

// FONCTION POUR RECUPERER UNE VARIABLE DANS LE LOCALSTORAGE ----------------------------------------------------------------------------------------------------------------
function recuperer(cle, default_value) { //cle = nom du stockage, default_value = variable par défaut si cle n'existe pas
    const data = localStorage.getItem(cle);
    return data ? JSON.parse(data) : default_value;
}


// LISTES --------------------------------------------------------------------------------------------------------------------------------------------------------------------
let tab_etu = recuperer('tab_etu', []); //Contient les liste étudiant(e)s
let tab_salles = recuperer('tab_salles', []); //Contient les salles et leurs places
let tab_matiere = recuperer('tab_matiere', ["", "Chimie", "Physique"]); //Contient les matières
let tab_placer = recuperer('tab_placement', []); //Contient l'historique des placements
let tab_filtres_prc = recuperer('tab_filtres_prc', {}); //Contient la liste des filtres des parcours



//Variables des selection dans .selects_table
const select_etu = document.querySelector("#select_etu"); //Selection des étudiants
const select_salle = document.querySelector("#select_salle"); //Selection des salles
const select_matiere = document.querySelector("#select_matiere");  //Selection des matières

//Variable pour les filtres de parcours
const conteneur_filtres = document.querySelector(".filtres_table");

//Variable pour le tableau
const tableau_etu = document.querySelector(".exam-table tbody");