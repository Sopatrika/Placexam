// On récupère les listes présent dans le stockage locale
let tab_etu = JSON.parse(localStorage.getItem('tab_etu')) || []; //contient toutes les listes étudiantes
let tab_salles = JSON.parse(localStorage.getItem('tab_salles')) || []; //contient toutes les listes des places des salles d'exam
let tab_matiere = JSON.parse(localStorage.getItem('tab_matiere')) || ["Chimie", "Physique"]; //contient la liste des matières enseignés
let tab_placer = JSON.parse(localStorage.getItem('tab_placement')) || []; //contient l'historique des placements
let tab_filtres_prc = JSON.parse(localStorage.getItem('tab_filtres_prc')) || {}; //contient la liste des filtres des parcours existant