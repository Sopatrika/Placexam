//=================================================================================================================================================================
// GESTION DES VARIABLES
//=================================================================================================================================================================

// OBJECT QUI S'OCCUPE DU LOCALSTORAGE ----------------------------------------------------------------------------------------------------------------------------------
const AppStorage = {
    master_key: "placexam_data",
    data: null,

    init() {
        const existingData = localStorage.getItem(this.master_key);
        
        if (existingData) {
            try { this.data = JSON.parse(existingData); } 
            catch (e) { console.error("Erreur, on repart à zéro", e); }
        }
        
        // Si le localStorage est totalement vide ou incomplet
        if (!this.data) {
            this.data = {
                imports: { etu: [], salles: [], matiere: [], raw_etu: "", raw_matiere: "" },
                placements: [],
                forms: {}, 
                prefs: { filtres_spe: {}, placer_actuel: "" },
                autres: {} 
            };
        } else if (!this.data.autres) {
            this.data.autres = {}; 
        }

        // 🌟 SÉCURITÉ MAGIQUE AMPHIS (Imparable !)
        // On vérifie bien le tableau "salles", et s'il est vide on injecte tout
        if (!this.data.imports.salles || this.data.imports.salles.length === 0) {
            this.data.imports.salles = [
                { nom_salle: "Amphi1", capacite_max: 174, nbr_rangees: 12, sieges_espaces: 2, places_banni: [] },
                { nom_salle: "Amphi2", capacite_max: 126, nbr_rangees: 13, sieges_espaces: 2, places_banni: [] },
                { nom_salle: "Amphi3", capacite_max: 110, nbr_rangees: 10, sieges_espaces: 2, places_banni: [] },
                { nom_salle: "Amphi4", capacite_max: 90,  nbr_rangees: 8,  sieges_espaces: 2, places_banni: [] },
                { nom_salle: "Amphi5", capacite_max: 110, nbr_rangees: 10, sieges_espaces: 2, places_banni: [] }
            ];
        }

        this.saveAll();
    },

    saveAll() {
        try {
            localStorage.setItem(this.master_key, JSON.stringify(this.data));
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                alert("⚠️ Attention : La mémoire est pleine !");
            }
        }
    }
};

AppStorage.init();


// FONCTION POUR SAUVEGARDER DANS LE LOCALSTORAGE -----------------------------------------------------------------------------------------------------------------------------
function sauvegarder(cle, donnees) {
    switch (cle) {
        case "tab_etu": AppStorage.data.imports.etu = donnees; break;
        case "tab_salles": AppStorage.data.imports.salles = donnees; break;
        case "tab_matiere": AppStorage.data.imports.matiere = donnees; break;
        case "tab_placement": AppStorage.data.placements = donnees; break;
        case "tab_filtres_spe": AppStorage.data.prefs.filtres_spe = donnees; break;
        case "placer_actuel": AppStorage.data.prefs.placer_actuel = donnees; break;
        
        // On fusionne intelligemment les selects avec les forms !
        case "select_etu":
        case "select_salle":
        case "select_matiere":
            AppStorage.data.forms[cle] = donnees;
            break;

        default:
            if (cle.startsWith("form:")) {
                const id = cle.replace("form:", "").trim();
                AppStorage.data.forms[id] = donnees;
            } else {
                // Tout le reste (comme les configs Import_) va dans "autres"
                AppStorage.data.autres[cle] = donnees;
            }
    }
    
    AppStorage.saveAll();
} 

//FONCTION POUR RECUPERER DANS LE LOCALSTORAGE -----------------------------------------------------------------------------------------------------------------------------
function recuperer(cle, default_value) { 
    switch (cle) {
        case "tab_etu": return AppStorage.data.imports.etu;
        case "tab_salles": return AppStorage.data.imports.salles;
        case "tab_matiere": return AppStorage.data.imports.matiere;
        case "tab_placement": return AppStorage.data.placements;
        case "tab_filtres_spe": return AppStorage.data.prefs.filtres_spe;
        case "placer_actuel": return AppStorage.data.prefs.placer_actuel !== undefined ? AppStorage.data.prefs.placer_actuel : default_value;
        
        case "select_etu":
        case "select_salle":
        case "select_matiere":
            return AppStorage.data.forms[cle] !== undefined ? AppStorage.data.forms[cle] : default_value;

        default:
            if (cle.startsWith("form:")) {
                const id = cle.replace("form:", "").trim();
                const val = AppStorage.data.forms[id];
                return val !== undefined ? val : default_value;
            }

            // On vérifie dans la boîte "autres"
            if (AppStorage.data.autres && AppStorage.data.autres[cle] !== undefined) {
                return AppStorage.data.autres[cle];
            }
            return default_value;
    }
}

//FONCTION POUR SUPPRIMER DANS LE LOCALSTORAGE -----------------------------------------------------------------------------------------------------------------------------
function effacer_storage(cle) {
    switch (cle) {
        case "placer_actuel": 
            delete AppStorage.data.prefs.placer_actuel; 
            break;
        case "select_etu":
        case "select_salle":
        case "select_matiere":
            delete AppStorage.data.forms[cle];
            break;
        default:
            if (cle.startsWith("form:")) {
                const id = cle.replace("form:", "").trim();
                delete AppStorage.data.forms[id];
            } else if (AppStorage.data.autres) {
                delete AppStorage.data.autres[cle];
            }
    }
    AppStorage.saveAll();
}

// *VARIABLES GLOBALES
let tab_etu = AppStorage.data.imports.etu;
let tab_salles = AppStorage.data.imports.salles;
let tab_matiere = AppStorage.data.imports.matiere;
let tab_placer = AppStorage.data.placements;
let tab_filtres_spe = AppStorage.data.prefs.filtres_spe;

//Variable du menu gauche
const sous_sec = document.querySelector(".sous_sec");
const etu_sec = document.querySelector(".etu_sec");
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
        champs: (objet_a_editer, nom_liste) => {
            let champs_dynamiques = [];
            let reference_etu = objet_a_editer;
            
            if (!reference_etu) {
                let listeEtu = getListeEtu(nom_liste);
                if (listeEtu && listeEtu.donnees && listeEtu.donnees.length > 0) {
                    reference_etu = listeEtu.donnees[0];
                }
            }

            if (reference_etu) {
                const cles_interdites = ["tiers_temps", "absent"];
                for (let key in reference_etu) {
                    if (!cles_interdites.includes(key)) {
                        champs_dynamiques.push({
                            id: key,
                            label: key.toUpperCase(),
                            type: "text",
                            //nom et prenom sont obligatoires
                            obligatoire: (key === "nom" || key === "prenom") 
                        });
                    }
                }
            }
            if (champs_dynamiques.length === 0) {
                champs_dynamiques = [
                    { id: "nom", label: "Nom", type: "text", obligatoire: true },
                    { id: "prenom", label: "Prénom", type: "text", obligatoire: true },
                    { id: "specialite", label: "Spécialité", type: "text", obligatoire: false }
                ];
            }

            return champs_dynamiques;
        },
        format_affichage: (item, index) => {
            let lignes = Object.keys(item)
                .filter(key => key !== "tiers_temps")
                .map(key => item[key]); 
            
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
            
            if (!listeEtu || !listeEtu.donnees) return; 

            if (mode === "ajouter") {
                let etu_data = { tiers_temps: false, ...objet }; // Fusionne tout
                listeEtu.donnees.unshift(etu_data);
            } else {
                let etu_existant = listeEtu.donnees[index];
                if (etu_existant) {
                    for (let key in objet) {
                        etu_existant[key] = objet[key]; // Met à jour chaque clé dynamiquement
                    }
                    listeEtu.donnees[index] = etu_existant;
                }
            }
            sauvegarder("tab_etu", tab_etu);
            if (select_etu.value === nom_liste) generer_filtres(); 
            fermer_et_recharger(nom_liste);
        }
    },
    "salle": {
        nom_liste: "Salles",
        storage_key: "tab_salles",
        titres: { ajouter: "", modifier: "Modifier la salle" },
        affichage: { recherche: false, icon_tierstemps: false, bouton_ajout: false, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: () => tab_salles,
        champs: [
            { id: "nom_salle", label: "Nom Salle", type: "text", obligatoire: true },
            { id: "capacite_max", label: "Capacité max", type: "number", obligatoire: true },
            { id: "nbr_rangees", label: "Nombre de rangées", type: "number", obligatoire: true },
            { id: "sieges_espaces", label: "Sièges espacés", type: "number", obligatoire: true }
        ],
        format_affichage: (item, index) => [
            `<b>${item.nom_salle}</b>`,
            `Capacité max : <b>${item.capacite_max}</b> places`,
            `Nombre de rangées : <b>${item.nbr_rangees}</b>`,
            `Espaces entre étudiants : <b>${item.sieges_espaces}</b> siège(s)`
        ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            let ancien_nom = mode === "modifier" ? tab_salles[index].nom_salle : null;
            
            // Sécurité : On génère un nom unique si besoin
            if (typeof generer_nom_unique === "function") {
                objet.nom_salle = generer_nom_unique(objet.nom_salle, tab_salles, "nom_salle", mode === "modifier" ? index : -1);
            }

            if (mode === "modifier") {
                // On conserve l'historique des places bannies et indisponibles
                objet.places_banni = tab_salles[index].places_banni || []; 
                if (tab_salles[index].places_indispo) {
                    // On filtre au cas où on a réduit la taille de la salle
                    objet.places_indispo = tab_salles[index].places_indispo.filter(p => p <= objet.capacite_max);
                } else {
                    objet.places_indispo = [];
                }
                // On écrase l'ancienne salle avec les nouvelles valeurs
                tab_salles[index] = objet; 
                // Si on a changé le nom de la salle, on met à jour le tableau du milieu !
                if (ancien_nom && ancien_nom !== objet.nom_salle) {
                    let index_choisie = salles_choisies.indexOf(ancien_nom);
                    if (index_choisie !== -1) {
                        salles_choisies[index_choisie] = objet.nom_salle;
                        if (salle_active === ancien_nom) salle_active = objet.nom_salle;
                        if (typeof maj_select_salles_sup === "function") maj_select_salles_sup();
                        if (typeof dessiner_badges_salles === "function") dessiner_badges_salles();
                    }
                    if (typeof maj_dependances_nom === "function") {
                        maj_dependances_nom("salle", ancien_nom, objet.nom_salle);
                    }
                }
            }
            
            sauvegarder("tab_salles", tab_salles);
            if (typeof remplir_select === "function") remplir_select();
            if (typeof verifier_capacite === "function") verifier_capacite();
            fermer_et_recharger(nom_liste);
        }
    },
    "matiere": {
        nom_liste: "Matières",
        storage_key: "tab_matiere",
        titres: { ajouter: "Ajouter une matière", modifier: "Modifier la matière" },
        affichage: { recherche: true, icon_tierstemps: false, bouton_ajout: true, supp_histo: false },
        section_retour: ".sous_sec",
        get_donnees: () => tab_matiere,
        champs: [ 
            { id: "nom", label: "Nom de la matière", type: "text", obligatoire: true } ,
            { id: "prof", label: "Nom du professeur", type: "text", obligatoire: false } 
        ],
        format_affichage: (item, index) => [
            `<b>${item.nom}</b>`,
            `Professeur : ${item.prof || "Non renseigné"}`
        ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            objet.nom = generer_nom_unique(objet.nom, tab_matiere, "nom", mode === "modifier" ? index : -1);

            if (mode === "ajouter") {
                tab_matiere.unshift({ nom: objet.nom, prof: objet.prof });
            } else {
                let ancien_nom = tab_matiere[index].nom;
                let ancien_prof = tab_matiere[index].prof || "Non renseigné";
                let ancienne_valeur_select = `${ancien_nom} (${ancien_prof})`;

                let nouveau_prof = objet.prof || "Non renseigné";
                let nouvelle_valeur_select = `${objet.nom} (${nouveau_prof})`;

                tab_matiere[index] = { nom: objet.nom, prof: objet.prof };

                if (ancienne_valeur_select !== nouvelle_valeur_select) {
                    if (typeof maj_dependances_nom === "function") {
                        maj_dependances_nom("matiere", ancienne_valeur_select, nouvelle_valeur_select);
                    }
                }
            }
            sauvegarder("tab_matiere", tab_matiere);
            fermer_et_recharger(nom_liste);
            remplir_select()
        }
    },
    "historique": { 
        nom_liste: "Historique des placements",
        storage_key: "tab_placement",
        titres: { ajouter: "", modifier: "Modifier l'historique" },
        affichage: { recherche: false, icon_tierstemps: false, bouton_ajout: false, supp_histo: true },
        section_retour: ".sous_sec",
        get_donnees: () => tab_placer,
        champs: [ { id: "titre", label: "Titre du placement", type: "text", obligatoire: true } ],
        format_affichage: (item, index) => [
            `${item.titre || "Placement n°" + (index+1)}`
        ],
        sauvegarder_element: (objet, mode, index, nom_liste) => {
            let ancien_titre = tab_placer[index].titre;
            objet.titre = generer_nom_unique(objet.titre, tab_placer, "titre", mode === "modifier" ? index : -1);

            tab_placer[index].titre = objet.titre;
            
            if (recuperer("form:select_etu") === ancien_titre) {
                sauvegarder("placer_actuel", objet.titre);
            }
            
            sauvegarder("tab_placement", tab_placer);
            fermer_et_recharger(nom_liste);
        }
    }
};

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
const edition_erreur = document.querySelector(".edition_erreur");

// --- ELEMENTS DU MENU PRINCIPAL ---
const conteneur_etu_ul = document.querySelector(".etu_sec .menu_ul");
const conteneur_salle_ul = document.querySelector(".salle_sec .menu_ul");

// --- OPTIONS DU TABLEAU ---
const check_tiers_temps = document.querySelector(".tri_tiers_temps"); // La checkbox "Tiers temps en premier"

// TABLEAU -------------
const tbody = document.querySelector(".exam-table tbody");

//PLAN DE SALLE ---------------------

const mode_indispo = document.getElementById("mode_indispo");

// Variable pour stocker un nombre illimité de salles choisies
let salles_choisies = [];
let salle_active = "";

//Svg tier-temps 
const svg_tier_temps = `<svg width="25" height="24" viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.40267 22.5167C5.12867 21.9722 4.01528 21.2236 3.0625 20.2708C2.10972 19.3181 1.36111 18.2047 0.816667 16.9307C0.272222 15.6567 0 14.2909 0 12.8333C0 11.3758 0.272222 10.01 0.816667 8.736C1.36111 7.462 2.10972 6.34861 3.0625 5.39583C4.01528 4.44306 5.12867 3.69444 6.40267 3.15C7.67667 2.60556 9.04244 2.33333 10.5 2.33333C10.9083 2.33333 11.3023 2.35783 11.6818 2.40683C12.0614 2.45583 12.4452 2.52856 12.8333 2.625V5.01667C12.4444 4.9 12.0606 4.8125 11.6818 4.75417C11.3031 4.69583 10.9091 4.66667 10.5 4.66667C8.20556 4.66667 6.27083 5.45417 4.69583 7.02917C3.12083 8.60417 2.33333 10.5389 2.33333 12.8333C2.33333 15.1278 3.12083 17.0625 4.69583 18.6375C6.27083 20.2125 8.20556 21 10.5 21C12.7944 21 14.7292 20.2125 16.3042 18.6375C17.8792 17.0625 18.6667 15.1278 18.6667 12.8333C18.6667 12.6194 18.6569 12.425 18.6375 12.25C18.6181 12.075 18.5889 11.8806 18.55 11.6667H20.9417C20.9806 11.8806 21 12.075 21 12.25V12.8333C21 14.2917 20.7278 15.6578 20.1833 16.9318C19.6389 18.2058 18.8903 19.3188 17.9375 20.2708C16.9847 21.2228 15.8713 21.9714 14.5973 22.5167C13.3233 23.0619 11.9576 23.3341 10.5 23.3333C9.04244 23.3326 7.67667 23.0603 6.40267 22.5167ZM13.7667 17.7333L9.33333 13.3V7H11.6667V12.3667L15.4 16.1L13.7667 17.7333ZM18.6667 9.33333V5.83333H15.1667V3.5H18.6667V0H21V3.5H24.5V5.83333H21V9.33333H18.6667Z" stroke="none"/>
</svg>`;



// FONCTION POUR EVITER DES INJECTIONS ---------------------------------------------------------------------------------------------------------
function echapperHTML(texte) {
    if (!texte) return "";
    return String(texte)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// FONCTION POUR COMPARER DEUX NOMS PROPREMENT ----------------------------------------------------------------------------------------------------------------------------------
function comparerNoms(nom1, nom2) {
    return String(nom1 || "").trim().toLowerCase() === String(nom2 || "").trim().toLowerCase();
}