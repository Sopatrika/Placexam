
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

//FONCTION POUR RETIRER UN ELEMENT DU LOCALSTORAGE -----------------------------------------------------------------------------------------------------------------------------
function effacer_storage(cle) {
    localStorage.removeItem(cle);
}


// LISTES --------------------------------------------------------------------------------------------------------------------------------------------------------------------
let tab_etu = recuperer('tab_etu', []); //Contient les liste étudiant(e)s
let tab_salles = recuperer('tab_salles', []); //Contient les salles et leurs places
let tab_matiere = recuperer('tab_matiere', []); //Contient les matières
let tab_placer = recuperer('tab_placement', []); //Contient l'historique des placements
let tab_filtres_spe = recuperer('tab_filtres_spe', {}); //Contient la liste des filtres des spécialités

//Variable du menu gauche

const sous_sec = document.querySelector(".sous_sec");

const edition_sec = document.querySelector(".edition_sec");

//Variables des selection dans .selects_table
const select_etu = document.querySelector("#select_etu"); //Selection des étudiants
const select_salle = document.querySelector("#select_salle"); //Selection des salles
const select_matiere = document.querySelector("#select_matiere");  //Selection des matières

//Variable pour les filtres de parcours
const conteneur_filtres = document.querySelector(".filtres_spe");

//Variable pour le tableau
const tableau_etu = document.querySelector(".exam-table tbody");

//Variable pour les plans

////LOCKUP TABLE POUR LES SECTIONS DU MENU GAUCHE
// c'est un tableau qui permet de définir les variables de chaque sections (liste ou sous-liste), afin de récuperer certaines informations beaucoup plus facilement (titre, barre de recherche)

//titres : titres des menus dans les sections ajouter et modifier
//affichage : afficher quel éléments en fonction de la section cliqué (barre de recherche, supprimer l'historique...)
//section_retour : section qui apparait quand on clique sur retour
//get_donnes : récupérer les données à afficher
//champs: champs à afficher lorsqu'on ouvre le menu ajouter ou modifier d'un élément
//sauvegarder_elements: lorsqu'on clique sur un bouton ajouter, quel élément à sauvegarder
const CONFIG_SECTION = {
    "etu": { 
        titres: { ajouter: "Ajouter un étudiant", modifier: "Modifier l'étudiant" },
        affichage: { recherche: true, bouton_ajout: true, ligne_simple: false, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: (nom) => getListeEtu(nom).donnees,
        champs: [
            { id: "nom", label: "Nom", type: "text" },
            { id: "prenom", label: "Prénom", type: "text" },
            { id: "specialite", label: "Spécialité", type: "text" }
        ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            let listeEtu = getListeEtu(nom_liste);
            let etu_data = { nom: objet.nom, prenom: objet.prenom, specialite: objet.specialite, tiers_temps: false };
            if (mode === "ajouter") listeEtu.donnees.push(etu_data);
            else {
                etu_data.tiers_temps = listeEtu.donnees[index].tiers_temps;
                listeEtu.donnees[index] = etu_data;
            }
            sauvegarder("tab_etu", tab_etu);
            if (select_etu.value === nom_liste) generer_filtres(); 
            fermer_et_recharger(nom_liste);
        }
    },
    "salle": { 
        titres: { ajouter: "", modifier: "Modifier la salle" },
        affichage: { recherche: false, bouton_ajout: false, ligne_simple: false, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: () => tab_salles,
        champs: [
            { id: "nom_salle", label: "Nom Salle", type: "text" },
            { id: "capacite_max", label: "Capacité max", type: "number" },
            { id: "nbr_rangees", label: "Nombre de rangées", type: "number" },
            { id: "sieges_espaces", label: "Sièges espacés", type: "number" }
        ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            if (mode === "modifier") {
                objet.places_banni = tab_salles[index].places_banni || null; 
                tab_salles[index] = objet; 
                sauvegarder("tab_salles", tab_salles);
                if (typeof verifier_capacite === "function") verifier_capacite();
                fermer_et_recharger("Salles"); 
            }
        }
    },
    "matiere": { 
        titres: { ajouter: "Ajouter une matière", modifier: "Modifier la matière" },
        affichage: { recherche: false, bouton_ajout: true, ligne_simple: true, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: () => tab_matiere,
        champs: [ { id: "nom", label: "Nom de la matière", type: "text" } ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            if (mode === "ajouter") tab_matiere.push(objet.nom);
            else tab_matiere[index] = objet.nom;
            sauvegarder("tab_matiere", tab_matiere);
            fermer_et_recharger(nom_liste);
        }
    },
    "historique": { 
        titres: { ajouter: "", modifier: "Modifier l'historique" },
        affichage: { recherche: false, bouton_ajout: false, ligne_simple: true, supp_histo: true },
        section_retour: ".sous_sec",
        get_donnees: () => tab_placer,
        champs: [ { id: "titre", label: "Titre du placement", type: "text" } ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            tab_placer[index].titre = objet.titre;
            sauvegarder("tab_placement", tab_placer);
            fermer_et_recharger(nom_liste);
        }
    }
};

const edition_erreur = document.querySelector(".edition_erreur");

// --- TITRES ET CONTENEURS (Menu Gauche) ---
const label_nom_liste = document.querySelector(".nom_liste"); // Titre de la liste affichée
const conteneur_liste_elements = document.querySelector(".liste_elements"); // Là où on affiche les étudiants/salles
const sec_first = document.querySelector(".first_sec"); // La barre du haut (avec retour et nom de liste)
const conteneur_search_bar = document.querySelector(".search_bar"); 
const search_input_etu = document.querySelector(".search_bar input");
const btn_ajouter = document.querySelector(".btn_ajouter"); 
const btn_supp_histo = document.querySelector(".btn_supp_historique");

// --- ELEMENTS DU MENU D'EDITION ---
const form_edition = document.querySelector(".form_edition");
const titre_edition_sec = document.querySelector(".titre_edition_sec");

// --- ELEMENTS DU MENU PRINCIPAL ---
const conteneur_etu_ul = document.querySelector(".etu_sec .menu_ul");
const conteneur_salle_ul = document.querySelector(".salle_sec .menu_ul");

// --- OPTIONS DU TABLEAU ---
const check_tiers_temps = document.querySelector(".tri_tiers_temps"); // La checkbox "Tiers temps en premier"

// Variable pour stocker un nombre illimité de salles choisies
let salles_choisies = [];