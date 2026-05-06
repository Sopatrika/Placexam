
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
    return data ? JSON.parse(data) : default_value; //Si data ne possède rien, alors on met une valeur par défaut
}


// LISTES --------------------------------------------------------------------------------------------------------------------------------------------------------------------
let tab_etu = recuperer('tab_etu', []); //Contient les liste étudiant(e)s
let tab_salles = recuperer('tab_salles', []); //Contient les salles et leurs places
let tab_matiere = recuperer('tab_matiere', ["", "Chimie", "Physique"]); //Contient les matières
let tab_placer = recuperer('tab_placement', []); //Contient l'historique des placements
let tab_filtres_prc = recuperer('tab_filtres_prc', {}); //Contient la liste des filtres des parcours

//Variable du menu gauche

const sous_sec = document.querySelector(".sous_sec");

const edition_sec = document.querySelector(".edition_sec");

//Variables des selection dans .selects_table
const select_etu = document.querySelector("#select_etu"); //Selection des étudiants
const select_salle = document.querySelector("#select_salle"); //Selection des salles
const select_matiere = document.querySelector("#select_matiere");  //Selection des matières

//Variable pour les filtres de parcours
const conteneur_filtres = document.querySelector(".filtres_table");

//Variable pour le tableau
const tableau_etu = document.querySelector(".exam-table tbody");

////LOCKUP TABLE POUR LES SECTIONS DU MENU GAUCHE
// c'est un tableau qui permet de définir les variables de chaque sections (liste ou sous-liste), afin de récuperer certaines informations beaucoup plus facilement (titre, barre de recherche)
const CONFIG_SECTION = {
    "etu": { 
        titres: { ajouter: "Ajouter un étudiant", modifier: "Modifier l'étudiant" },
        affichage: { recherche: true, bouton_ajout: true, ligne_simple: false, supp_total: false },
        section_retour: ".etu_sec"
    },
    "salle": { 
        titres: { ajouter: "Ajouter une place", modifier: "Modifier la place" },
        affichage: { recherche: false, bouton_ajout: true, ligne_simple: false, supp_total: false },
        section_retour: ".salle_sec"
    },
    "matiere": { 
        titres: { ajouter: "Ajouter une matière", modifier: "Modifier la matière" },
        affichage: { recherche: false, bouton_ajout: true, ligne_simple: true, supp_total: false },
        section_retour: ".sous_sec"
    },
    "historique": { 
        titres: { ajouter: "", modifier: "Renommer le placement" },
        affichage: { recherche: false, bouton_ajout: false, ligne_simple: true, supp_total: true },
        section_retour: ".sous_sec"
    },
    "nom_liste_etu": {
        titres: { modifier: "Renommer la liste d'étudiants", supp_total: false },
        section_retour: ".etu_sec"
    },
    "nom_liste_salle": {
        titres: { modifier: "Renommer la salle", supp_total: false },
        section_retour: ".salle_sec"
    }
};

const edition_erreur = document.querySelector(".edition_erreur");
const edition_valid = document.querySelector("#edition_valid");

// --- TITRES ET CONTENEURS (Menu Gauche) ---
const label_nom_liste = document.querySelector(".nom_liste"); // Titre de la liste affichée
const conteneur_liste_elements = document.querySelector(".liste_elements"); // Là où on affiche les étudiants/salles
const sec_first = document.querySelector(".first_sec"); // La barre du haut (avec retour et nom de liste)
const conteneur_search_bar = document.querySelector(".search_bar"); 
const search_input_etu = document.querySelector(".search_bar input");
const btn_ajouter = document.querySelector(".btn_ajouter"); 

// --- ELEMENTS DU MENU D'EDITION ---
const form_edition = document.querySelector(".form_edition");
const titre_edition_sec = document.querySelector(".titre_edition_sec");

// --- ELEMENTS DU MENU PRINCIPAL ---
const conteneur_etu_ul = document.querySelector(".etu_sec .menu_ul");
const conteneur_salle_ul = document.querySelector(".salle_sec .menu_ul");

// --- OPTIONS DU TABLEAU ---
const check_tiers_temps = document.querySelector(".tri_tiers_temps"); // La checkbox "Tiers temps en premier"