
//=================================================================================================================================================================
// GESTION DES VARIABLES
//=================================================================================================================================================================

// FONCTION POUR SAUVEGARDER UNE VARIABLE DANS LE LOCALSTORAGE --------------------------------------------------------------------------------------------------------------
function sauvegarder(cle, donnees) { //cle = nom du stockage, donnees = variable à stocker
    localStorage.setItem(cle, JSON.stringify(donnees));
}

// FONCTION POUR RECUPERER UNE VARIABLE DANS LE LOCALSTORAGE ----------------------------------------------------------------------------------------------------------------
function recuperer(cle, default_value) { 
    const data = localStorage.getItem(cle);
    if (!data) return default_value;
    
    //pour attraper les erreurs silencieusement
    try {
        return JSON.parse(data);
    } catch (erreur) {
        return data; // Si c'est du texte brut, on le retourne
    }
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
        affichage: { recherche: true, icon_tierstemps: true, bouton_ajout: true, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: (nom) => getListeEtu(nom).donnees,
        champs: [
            { id: "nom", label: "Nom", type: "text" },
            { id: "prenom", label: "Prénom", type: "text" },
            { id: "specialite", label: "Spécialité", type: "text" }
        ],
        format_affichage: (item, index) => {
            let lignes = Object.keys(item)
                .filter(key => key !== "tiers_temps")
                .map(key => item[key]); // Récupère toutes les infos (nom, prenom, etc.)
            
            const estCoche = item.tiers_temps ? "checked" : "";
            lignes.push(`
                <label class="badge-checkbox" style="--checkcolor: none">
                    <input type="checkbox" class="check_tier" ${estCoche}>
                    <span class="badge-text">Tiers-temps</span>
                    <span class="custom-checkbox"></span>
                </label>
            `);
            return lignes;
        },
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            let listeEtu = getListeEtu(nom_liste);
            let etu_data = { nom: objet.nom, prenom: objet.prenom, specialite: objet.specialite, tiers_temps: false };
            if (mode === "ajouter") listeEtu.donnees.unshift(etu_data);
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
        nom_liste: "Salles",
        storage_key: "tab_salles",
        tableau: tab_salles,
        titres: { ajouter: "", modifier: "Modifier la salle" },
        affichage: { recherche: false, icon_tierstemps: false, bouton_ajout: false, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: () => tab_salles,
        champs: [
            { id: "nom_salle", label: "Nom Salle", type: "text" },
            { id: "capacite_max", label: "Capacité max", type: "number" },
            { id: "nbr_rangees", label: "Nombre de rangées", type: "number" },
            { id: "sieges_espaces", label: "Sièges espacés", type: "number" }
        ],
        format_affichage: (item, index) => [
            `<b>${item.nom_salle}</b>`,
            `Capacité max : <b>${item.capacite_max}</b> places`,
            `Nombre de rangées : <b>${item.nbr_rangees}</b>`,
            `Espaces entre étudiants : <b>${item.sieges_espaces}</b> siège(s)`
        ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            if (mode === "modifier") {
                objet.places_banni = tab_salles[index].places_banni || null; 
                tab_salles[index] = objet; 
                if (tab_salles[index].places_indispo) {
                    tab_salles[index].places_indispo = tab_salles[index].places_indispo.filter(p => p <= objet.capacite);
                }
                sauvegarder("tab_salles", tab_salles);
                if (typeof remplir_select === "function") remplir_select();
                if (typeof verifier_capacite === "function") verifier_capacite();
                fermer_et_recharger("Salles");
            }
        }
    },
    "matiere": {
        nom_liste: "Matières",
        storage_key: "tab_matiere",
        tableau: tab_matiere, 
        titres: { ajouter: "Ajouter une matière", modifier: "Modifier la matière" },
        affichage: { recherche: false, icon_tierstemps: false, bouton_ajout: true, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: () => tab_matiere,
        champs: [ 
            { id: "nom", label: "Nom de la matière", type: "text" } ,
            { id: "prof", label: "Nom du professeur", type: "text" } 
        ],
        format_affichage: (item, index) => [
            `<b>${item.nom}</b>`,
            `Professeur : ${item.prof || "Non renseigné"}`
        ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            if (mode === "ajouter") {
                tab_matiere.push({ nom: objet.nom, prof: objet.prof });
            } else {
                tab_matiere[index] = { nom: objet.nom, prof: objet.prof };
            }
            sauvegarder("tab_matiere", tab_matiere);
            fermer_et_recharger(nom_liste);
            if (typeof remplir_select === "function") remplir_select();

        }
    },
    "historique": { 
        nom_liste: "Historique des placements",
        storage_key: "tab_placement",
        tableau: tab_placer,
        titres: { ajouter: "", modifier: "Modifier l'historique" },
        affichage: { recherche: false, icon_tierstemps: false, bouton_ajout: false, supp_histo: true },
        section_retour: ".sous_sec",
        get_donnees: () => tab_placer,
        champs: [ { id: "titre", label: "Titre du placement", type: "text" } ],
        format_affichage: (item, index) => [
            `${item.titre || "Placement n°" + (index+1)}`
        ],
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
let salle_active = "";

//Svg tier-temps 
const svg_tier_temps = `<svg width="25" height="24" viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.40267 22.5167C5.12867 21.9722 4.01528 21.2236 3.0625 20.2708C2.10972 19.3181 1.36111 18.2047 0.816667 16.9307C0.272222 15.6567 0 14.2909 0 12.8333C0 11.3758 0.272222 10.01 0.816667 8.736C1.36111 7.462 2.10972 6.34861 3.0625 5.39583C4.01528 4.44306 5.12867 3.69444 6.40267 3.15C7.67667 2.60556 9.04244 2.33333 10.5 2.33333C10.9083 2.33333 11.3023 2.35783 11.6818 2.40683C12.0614 2.45583 12.4452 2.52856 12.8333 2.625V5.01667C12.4444 4.9 12.0606 4.8125 11.6818 4.75417C11.3031 4.69583 10.9091 4.66667 10.5 4.66667C8.20556 4.66667 6.27083 5.45417 4.69583 7.02917C3.12083 8.60417 2.33333 10.5389 2.33333 12.8333C2.33333 15.1278 3.12083 17.0625 4.69583 18.6375C6.27083 20.2125 8.20556 21 10.5 21C12.7944 21 14.7292 20.2125 16.3042 18.6375C17.8792 17.0625 18.6667 15.1278 18.6667 12.8333C18.6667 12.6194 18.6569 12.425 18.6375 12.25C18.6181 12.075 18.5889 11.8806 18.55 11.6667H20.9417C20.9806 11.8806 21 12.075 21 12.25V12.8333C21 14.2917 20.7278 15.6578 20.1833 16.9318C19.6389 18.2058 18.8903 19.3188 17.9375 20.2708C16.9847 21.2228 15.8713 21.9714 14.5973 22.5167C13.3233 23.0619 11.9576 23.3341 10.5 23.3333C9.04244 23.3326 7.67667 23.0603 6.40267 22.5167ZM13.7667 17.7333L9.33333 13.3V7H11.6667V12.3667L15.4 16.1L13.7667 17.7333ZM18.6667 9.33333V5.83333H15.1667V3.5H18.6667V0H21V3.5H24.5V5.83333H21V9.33333H18.6667Z" stroke="none"/>
                        </svg>`;