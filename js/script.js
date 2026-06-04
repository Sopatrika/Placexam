
//=================================================================================================================================================================
// GESTION DE FONCTIONS GENERALES OU DIVERS
//=================================================================================================================================================================

// Trouver une liste d'étudiant(e)s par son nom
function getListeEtu(nom_cherche) {
    return tab_etu.find(liste => liste.nom_fichier === nom_cherche);
}

// Trouver une salle par son nom
function getListeSalle(nom_cherche) {
    return tab_salles.find(salle => salle.nom_salle === nom_cherche);
}



// FONCTION POUR GENERER LES BOUTONS ANNULER ET VALIDER -----------------------------------------------------------------------------------------------
function injecter_boutons() {
    document.querySelectorAll(".groupe_btn[data-action]").forEach(zone => {
        const action = zone.dataset.action; 
        zone.innerHTML = `
            <div class="btn_annuler" data-action="${action}_annul">Annuler</div>
            <div class="btn_valider" data-action="${action}_valid">Valider</div>
        `;
    });
}
injecter_boutons();


const btn_creer_salle = document.querySelector(".btn_creer-salle");
const input_nom_salle = document.getElementById("nom_salle");
const input_nbr_places = document.getElementById("nbr_places");
const input_nbr_rangees = document.getElementById("nbr_rangees");
const input_sieges_espaces = document.getElementById("sieges_espaces"); 

// FONCTION POUR CREER UNE SALLE -----------------------------------------------------------------------------------------------------------------------------------
function creer_nouvelle_salle() {
    const input_nom = document.getElementById("nom_salle");
    const input_places = document.getElementById("nbr_places");
    const input_rangees = document.getElementById("nbr_rangees");
    const input_espaces = document.getElementById("sieges_espaces");
    const verif_message = document.getElementById("verif_salle");

    let nom = input_nom.value.trim();
    const places = parseInt(input_places.value);
    const rangees = parseInt(input_rangees.value);
    const espaces = parseInt(input_espaces.value) || 0; 

    if (!nom || isNaN(places) || isNaN(rangees) || places <= 0 || rangees <= 0 || espaces < 0) { //Si les champs ne sont pas rempli correctement
        verif_message.textContent = "Veuillez remplir correctement les champs obligatoires.";
        verif_message.style.color = "var(--rouge)";
        return;
    }

    if (places >= 10000 || rangees >= 5000 || espaces > 10) {
        verif_message.textContent = "Les valeurs dépassent la limite maximale";
        verif_message.style.color = "var(--rouge)";
        return;
    }

    let nom_final = generer_nom_unique(nom, tab_salles, "nom_salle"); //éviter que la salle a le meme nom qu'une autre

    const nouvelle_salle = {
        nom_salle: nom_final, //Nom
        capacite_max: places, //Nbr place
        nbr_rangees: rangees, //Nbr rangées
        sieges_espaces: espaces, //Espace entre étudiant
        places_banni: [] //Place indisponible
    };

    tab_salles.unshift(nouvelle_salle); //Ajoute la nouvelle salle
    sauvegarder("tab_salles", tab_salles); //enregistre

    verif_message.style.color = "var(--black)";
    verif_message.textContent = `Salle "${nom_final}" a été générée avec succès !`;
    input_nom.value = ""; input_places.value = ""; input_rangees.value = ""; input_espaces.value = "";

    effacer_storage("form: nom_salle"); effacer_storage("form: nbr_places");
    effacer_storage("form: nbr_rangees"); effacer_storage("form: sieges_espaces");

    afficher_listes();
    remplir_select();
}

//FONCTION POUR GERER LA FERMETURE OU LA VALIDATION DES PANNEAUX D'ACTIONS -------------------------------------------------------------------------------------------
function gerer_boutons_action(e) {
    const btn_groupe = e.target.closest(".groupe_btn > *"); 
    const panneau_parent = e.target.closest(".supprimer_sec, .edition_sec, .charger_sec");
    const panneau_import = e.target.closest(".menu_import"); 
    const panneau_export = e.target.closest("#menu_exporter"); 
    
    e.preventDefault(); 
    const texte_btn = btn_groupe.textContent.toLowerCase().trim();

    if (panneau_parent) {
        if (texte_btn.includes("annuler")) {
            if (typeof fermer_panneaux_action === "function") fermer_panneaux_action();
        } else {
            if (typeof action_en_attente === "function") {
                if (action_en_attente() !== false) fermer_panneaux_action();
            } else fermer_panneaux_action();
        }
    } 
    else if (panneau_import) {
        if (texte_btn.includes("annuler")) fermer_mapping();
        else if (typeof action_valider_import === "function") action_valider_import();
    }
    else if (panneau_export) {
        if (texte_btn.includes("annuler")) {
            document.getElementById("menu_exporter").classList.add("menu_close");
            document.querySelector(".fond_sombre").classList.add("menu_close");
        } else {
            valider_et_lancer_export();
        }
    }
}


//FONCTION POUR SAUVEGARDER LES INPUT COCHER ET LES SELECTIONS ----------------------------------------------------------------------------------
function EnregChoix() {
    const formElements = document.querySelectorAll('input[type="checkbox"], input[type="text"], input[type="number"], .selects_table select, .form_salle input');
    
    formElements.forEach(element => {
        if (!element.id) return;
        
        const storageKey = "form:" + element.id; 
        const savedValue = recuperer(storageKey, "");
        
        if (savedValue !== null && savedValue !== "") {
            if (element.type === 'checkbox') {
                element.checked = (savedValue === true || savedValue === 'true');
            } else if (element.tagName === 'SELECT') {
                const options = Array.from(element.options);
                const optionTrouvee = options.find(opt => comparerNoms(opt.value, savedValue));
                
                if (optionTrouvee) {
                    element.value = optionTrouvee.value;
                }
            } else {
                element.value = savedValue; 
            }
        }

        // Fonction unique de sauvegarde
        const enregistrerValeur = () => {
            const val = (element.type === 'checkbox') ? element.checked : element.value;
            sauvegarder(storageKey, val);
        };

        element.addEventListener('input', enregistrerValeur);
        element.addEventListener('change', enregistrerValeur);
    });
}

const btn_absence_tab = document.querySelectorAll("td .badge-checkbox");
const btn_absence_plan = document.querySelector("#label_absence");
const popup_absence = document.querySelector(".popup_absence");
const span_popup = document.querySelector("#nbr_absent");
const croix_popup_abs = document.querySelector("#remove_pop_absence");

let index_abs = null;


//FONCTION POUR GERER LES ABSENCES (AFFICHER LES ABSENCES, POUVOIR METTRE ABSENTS ET ENREGISTRER LES ABSENCES) -------------------------------------------------------
function maj_absences() {
    // vérifie s'il y a un placement en cours/chargé
    if (!placement_actuel_donnees || placement_actuel_donnees.length === 0) return;

    // compte toutes les cases absences cochées dans le tableau
    const cases_cochees = document.querySelectorAll(".check-absence:checked");
    const nbr_absences = cases_cochees.length;

    // met à jour le popup (si il y'a des absences, on fait afficher le popup)
    if (nbr_absences > 0) { 
        span_popup.textContent = nbr_absences;
        popup_absence.classList.add("pop");
    } else {
        popup_absence.classList.remove("pop");
    }

    placement_actuel_donnees.forEach(etu => etu.absent = false);
    //  met absent ceux qui sont cochés
    cases_cochees.forEach(cb => {
        const nom = cb.dataset.nom;
        const prenom = cb.dataset.prenom;
        const etu = placement_actuel_donnees.find(e => e.nom === nom && e.prenom === prenom);
        if (etu) etu.absent = true;
    });

    // Sauvegarde dans tab_placer
    // (Puisque index_edition correspond à l'archive chargée, on met à jour)
    if (typeof index_edition !== "undefined" && tab_placer[index_edition]) {
        tab_placer[index_edition].donnees_placement = placement_actuel_donnees;
        sauvegarder("tab_placement", tab_placer);
    }
    if (typeof colorier_places === "function") colorier_places(placement_actuel_donnees);
}


// FONCTION POUR RECUPERER LE PLACEMENT ACTUEL -----------------------------------------------------------------------------------------------------------------------
function recup_placement_enreg() {
    let titre_sauve = recuperer("placer_actuel", "");
    let index_sauve = tab_placer.findIndex(p => p.titre === titre_sauve);

    if (titre_sauve && index_sauve !== -1) {
        index_edition = index_sauve;
        charger_placement();
    } else {
        generer_filtres();
        if (typeof actualiser_affichage_complet === "function") actualiser_affichage_complet();
        if (typeof verifier_capacite === "function") verifier_capacite();
    }
}

//FONCTION POUR RESET LE PLACEMENT QUI EST ACTUELLEMENT CHARGE ---------------------------------------------------------------------------------------------------------------
function reset_placement(garder_salles = false) {
    effacer_storage("placer_actuel");
    placement_actuel_donnees = [];
    afficher_tableau();
    
    if (!garder_salles) { // <--- Si on ne demande pas de les garder, on vide
        salles_choisies = [];
    }
}

// FONCTION POUR CREER UNE LISTE DES ETUDIANTS ABSENT A LA LISTE DES ETUDIANTS ---------------------------------------------------------------------------------------------
const btn_popup_absence = document.querySelector(".btn_absence");

function creer_liste_absents() {
    const etudiants_absents = placement_actuel_donnees
        .filter(etu => etu.absent === true)
        .map(etu => ({ ...etu, absent: false })); 

    if (etudiants_absents.length === 0) return;

    const nom_base = "Absents - " + (select_etu.value || "Examen");
    const nom_final = generer_nom_unique(nom_base, tab_etu, "nom_fichier");

    tab_etu.unshift({
        nom_fichier: nom_final.trim(),
        date_import: new Date().toLocaleDateString(),
        donnees: etudiants_absents
    });

    sauvegarder("tab_etu", tab_etu);
    afficher_listes();
    remplir_select();
    document.querySelector(".popup_absence").classList.remove("pop");
}

function synchro_absence_plan(estCoche) {
    const detail_nom = document.getElementById("detail_nom").textContent;
    const detail_prenom = document.getElementById("detail_prenom").textContent;
    const case_tableau = document.querySelector(`.check-absence[data-nom="${detail_nom}"][data-prenom="${detail_prenom}"]`);
    
    if (case_tableau) {
        case_tableau.checked = estCoche;
        maj_absences();
    }
}



//FONCTION POUR GENERER UN NOM UNIQUE (éviter les doublons) -----------------------------------------------------------------------------------------------------------------
function generer_nom_unique(nom_base, tableau_recherche, cle_recherche, index_a_ignorer = -1) {
    let nom_final = String(nom_base).trim();
    let compteur = 1;
    
    // Tant qu'on trouve un élément avec le même nom (et qui N'EST PAS l'élément qu'on modifie), on incrémente
    while (tableau_recherche.some((item, idx) => item[cle_recherche] === nom_final && idx !== index_a_ignorer)) {
        nom_final = `${String(nom_base).trim()}_${compteur}`;
        compteur++;
    }
    return nom_final;
}

// FONCTION POUR METTRE À JOUR LES DÉPENDANCES LORS D'UN RENOMMAGE (Historique & Selects) -------------------------------------------------------------------------------------
//Permet de mettre a jour les selects et l'historique des placements quand on renomme une liste d'étudiant, une salle ou une matière
function maj_dependances_nom(type, ancien_nom, nouveau_nom) {
    let historique_modifie = false;

    // 1. Mise à jour dans TOUT l'historique des placements (tab_placer)
    tab_placer.forEach(placement => {
        // Renommage Liste Étudiants
        if (type === "etu" && comparerNoms(placement.nom_liste_etu, ancien_nom)) {
            placement.nom_liste_etu = nouveau_nom;
            historique_modifie = true;
        }
        // Renommage Salles
        else if (type === "salle") {
            if (placement.salles_choisies) {
                let idx = placement.salles_choisies.findIndex(s => comparerNoms(s, ancien_nom));
                if (idx !== -1) {
                    placement.salles_choisies[idx] = nouveau_nom;
                    historique_modifie = true;
                    
                    // Met à jour le titre du placement si la salle y figurait !
                    if (placement.titre && placement.titre.includes(ancien_nom)) {
                        placement.titre = placement.titre.replace(ancien_nom, nouveau_nom);
                    }
                }
            }
            if (placement.donnees_placement) {
                placement.donnees_placement.forEach(etu => {
                    if (comparerNoms(etu.salle_attribuee, ancien_nom)) {
                        etu.salle_attribuee = nouveau_nom;
                        historique_modifie = true;
                    }
                });
            }
        }
        // Renommage Matières
        else if (type === "matiere" && comparerNoms(placement.nom_matiere, ancien_nom)) {
            placement.nom_matiere = nouveau_nom;
            historique_modifie = true;
            
            // Met à jour le titre du placement si la matière y figurait !
            if (placement.titre && placement.titre.includes(ancien_nom)) {
                placement.titre = placement.titre.replace(ancien_nom, nouveau_nom);
            }
        }
    });

    if (historique_modifie) sauvegarder("tab_placement", tab_placer);

    // 2. Mise à jour du Placement en cours (si un placement est affiché à l'écran)
    if (type === "salle" && typeof placement_actuel_donnees !== "undefined") {
        let actualisation_requise = false;
        placement_actuel_donnees.forEach(etu => {
            if (comparerNoms(etu.salle_attribuee, ancien_nom)) {
                etu.salle_attribuee = nouveau_nom;
                actualisation_requise = true;
            }
        });
        if (actualisation_requise && typeof actualiser_affichage_complet === "function") {
            actualiser_affichage_complet();
        }
    }

    // 3. Mise à jour automatique des Selects (<select>)
    const storageKey = type === "etu" ? "form:select_etu" : (type === "salle" ? "form:select_salle" : "form:select_matiere");
    
    if (comparerNoms(recuperer(storageKey), ancien_nom)) {
        sauvegarder(storageKey, nouveau_nom); // Une seule sauvegarde propre !
        if (typeof remplir_select === "function") remplir_select();
    }
}

// INITIALISATION
remplir_select();
EnregChoix();