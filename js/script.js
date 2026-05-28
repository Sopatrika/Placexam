
//=================================================================================================================================================================
// GESTION DE FONCTIONS GENERALES OU DIVERS
//=================================================================================================================================================================

function getListeEtu(nom_cherche) {
    return tab_etu.find(liste => liste.nom_fichier === nom_cherche);
}

// Trouver une salle par son nom
function getListeSalle(nom_cherche) {
    return tab_salles.find(salle => salle.nom_salle === nom_cherche);
}

// ECOUTEUR GLOBAL DES CLICS -----------------------------------------------------------
document.addEventListener("click", (e) => {
    
    // OUVRIR UNE SOUS-LISTE
    if (e.target.classList.contains("nom_texte")) {
        const li = e.target.closest("li");
        const type_liste = li.dataset.type;
        section_precedente = e.target.closest("section"); 
        ouvrir_details_liste(li.dataset.name, type_liste);
    }
    
    // CLIC SUR BOUTON RETOUR
    else if (e.target.closest(".return_sec")) {
        fermer_formulaire(section_precedente);
    }

    // CLIC SUR SUPPRIMER
    else if (e.target.closest(".trash_element")) {
        supprimer(e.target.closest(".trash_element")); 
    }

    // CLIC SUR MODIFIER
    else if (e.target.closest(".rename_element")) {
        const bloc = e.target.closest(".bloc_element"); 
        const liListe = e.target.closest(".menu_ul > li"); 
        
        if (bloc) {
            index_edition = parseInt(bloc.dataset.index, 10);
            mode_edition = "modifier";
            edition_formulaire();
        } else if (liListe) {
            const isEtu = e.target.closest(".etu_sec") !== null;
            type_edition = isEtu ? "nom_liste_etu" : "nom_liste_salle";
            index_edition = Array.from(liListe.parentNode.children).indexOf(liListe);
            ancien_nom_liste = liListe.dataset.name;
            mode_edition = "modifier_liste";
            edition_formulaire();
        }
    }

    // CLIC POUR AJOUTER
    else if (e.target.closest(".btn_ajouter")) {
        mode_edition = "ajouter";
        index_edition = -1;
        edition_formulaire();
    }

    else if (e.target.closest(".load_element")) {
        const bloc = e.target.closest(".bloc_element");
        if (bloc) {
            // On mémorise quel placement l'utilisateur veut charger
            index_edition = parseInt(bloc.dataset.index, 10); 
            
            // On cache la liste et on ouvre la section de confirmation de chargement
            document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
            document.querySelector(".charger_sec").classList.add("sec_open");
        }
    }

    else if (e.target.dataset.action === "edition_annul") {
        edition_erreur.textContent = "";
        let selecteur_retour = (mode_edition === "modifier_liste") ? ".etu_sec" : CONFIG_SECTION[type_edition]?.section_retour;
        fermer_formulaire(document.querySelector(selecteur_retour));
    }
    else if (e.target.dataset.action === "charger_annul") {
        fermer_formulaire(document.querySelector(".sous_sec"));
    }
    else if (e.target.dataset.action === "import_annul") {
        if (typeof fermer_mapping === "function") fermer_mapping();
    }

    // ------------------ ROUTEUR DES BOUTONS VALIDER ------------------
    else if (e.target.dataset.action === "edition_valid") {
        valider_edition();
    }
    else if (e.target.dataset.action === "charger_valid") {
        charger_placement()
    }
    else if (e.target.dataset.action === "import_valid") {
        if (typeof action_valider_import === "function") action_valider_import();
    }
});

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

// FONCTION POUR CREER UNE SALLE -------------------------------------------------------------------------------------------------------------------
btn_creer_salle.addEventListener("click", () => {

        const input_nom = document.getElementById("nom_salle");
        const input_places = document.getElementById("nbr_places");
        const input_rangees = document.getElementById("nbr_rangees");
        const input_espaces = document.getElementById("sieges_espaces");
        const verif_message = document.getElementById("verif_salle");

        // nettoie les valeurs (trim enlève les espaces inutiles)
        let nom = input_nom.value.trim();
        const places = parseInt(input_places.value);
        const rangees = parseInt(input_rangees.value);
        const espaces = parseInt(input_espaces.value) || 0; // Si le champ d'espace est vide, on met 0 par défaut

        // Si les inputs ne sont pas rempli
        if (!nom || isNaN(places) || isNaN(rangees) || places <= 0 || rangees <= 0) {
            verif_message.textContent = "Veuillez remplir correctement les champs obligatoires.";
            verif_message.style.color = "var(--rouge, red)";
            return;
        }

        // Si une salle a le meme nom
        let nom_final = generer_nom_unique(nom, tab_salles, "nom_salle");

        // Création d'un nouvelle objet salle
        const nouvelle_salle = {
            nom_salle: nom_final,
            capacite_max: places,
            nbr_rangees: rangees,
            sieges_espaces: espaces,
            places_banni: []
        };

        tab_salles.unshift(nouvelle_salle);
        sauvegarder("tab_salles", tab_salles)

        // Message de confirmation
        verif_message.textContent = `La salle "${nom_final}" a été générée avec succès !`;
        verif_message.style.color = "var(--valide)";

        // vide les champs pour la prochaine salle
        input_nom.value = "";
        input_places.value = "";
        input_rangees.value = "";
        input_espaces.value = "";

        effacer_storage("form: nom_salle");
        effacer_storage("form: nbr_places");
        effacer_storage("form: nbr_rangees");
        effacer_storage("form: sieges_espaces");

        //  Mise à jour du menu gauche (si la fonction existe dans ce fichier)
        afficher_listes();
        remplir_select();
    });


//FONCTION POUR SAUVEGARDER LES INPUT COCHER ET LES SELECTIONS ----------------------------------------------------------------------------------
function EnregChoix() {
    const formElements = document.querySelectorAll('input[type="checkbox"], input[type="text"], input[type="number"], .selects_table select, .form_salle input');
    
    formElements.forEach(element => {
        if (!element.id) return;
        
        const storageKey = "form: "+ element.id;
        const savedValue = recuperer(storageKey, "");
        
        if (savedValue !== null) {
            if (element.type === 'checkbox') {
                element.checked = (savedValue === 'true');
            } else if (element.tagName === 'SELECT') {
                // Vérifier si l'option existe avant de l'assigner
                const options = Array.from(element.options);
                if (options.some(opt => opt.value === savedValue)) {
                    element.value = savedValue;
                }
            } else {
                element.value = savedValue; 
            }
        }

        element.addEventListener('input', () => {
            const val = (element.type === 'checkbox') ? element.checked : element.value;
            sauvegarder(storageKey, val);
        });
    });
}

const btn_absence_tab = document.querySelectorAll("td .badge-checkbox");
const btn_absence_plan = document.querySelector("#label_absence");
const popup_absence = document.querySelector(".popup_absence");
const span_popup = document.querySelector("#nbr_absent");
const croix_popup = document.querySelector(".remove_popup");

let index_abs = null;
croix_popup.addEventListener("click", () => { //Retire le popup
        popup_absence.classList.remove("pop");
    });


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

document.addEventListener("change", (e) => {
    if (e.target.classList.contains("check-absence")) {
        maj_absences();
    }
});

//Quand on coche depuis le plan (label_absence)
const check_absence_plan = document.getElementById("check_absence");
if (check_absence_plan) {
    check_absence_plan.addEventListener("change", (e) => {
        //récupère le nom et prénom de l'étudiant sélectionné sur le plan
        const detail_nom = document.getElementById("detail_nom").textContent;
        const detail_prenom = document.getElementById("detail_prenom").textContent;
        
        //trouve la case correspondante dans le tableau pour la cocher/decocher
        const case_tableau = document.querySelector(`.check-absence[data-nom="${detail_nom}"][data-prenom="${detail_prenom}"]`);
        
        if (case_tableau) {
            case_tableau.checked = e.target.checked;
            maj_absences();
        }
    });
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

window.addEventListener('load', () => {
    recup_placement_enreg();

    setTimeout(() => {
        if (typeof placement_actuel_donnees !== "undefined" && placement_actuel_donnees.length > 0) {
            if (typeof colorier_places === "function") {
                colorier_places(placement_actuel_donnees);
            }
        }
    }, 300);

});

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
btn_popup_absence.addEventListener("click", () => {
    // récupère les absents
    const etudiants_absents = placement_actuel_donnees
        .filter(etu => etu.absent === true)
        .map(etu => ({
            nom: etu.nom,
            prenom: etu.prenom,
            specialite: etu.specialite,
            tiers_temps: etu.tiers_temps,
            infos_bonus: etu.infos_bonus || null
        }));

    if (etudiants_absents.length === 0) return;

    // 2. On génère un nom par défaut et on demande confirmation
    const nom_base = "Absents - " + (select_etu.value || "Examen");
    const nom_final = generer_nom_unique(nom_base, tab_etu, "nom_fichier");

    // injecte la liste au début de tab_etu
    tab_etu.unshift({
        nom_fichier: nom_final.trim(),
        date_import: new Date().toLocaleDateString(),
        donnees: etudiants_absents
    });

    sauvegarder("tab_etu", tab_etu);

    afficher_listes();
    remplir_select();

    // 6. On ferme le popup
    popup_absence.classList.remove("pop");
});



// EXPORTER LES DONNÉES EN JSON ------------------------------------------------------------------------------------------------------------------------------------
function exporterDonnees() {
    const data = {
        tab_etu: tab_etu,
        tab_filtres_spe: tab_filtres_spe,
        tab_matiere: tab_matiere,
        tab_placement: tab_placer,
        tab_salles: tab_salles
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Nom du fichier : Placexam_export_YYYYMMDD_HHMMSS.json
    const now = new Date();
    const dateStr = now.getFullYear() + 
                    String(now.getMonth()+1).padStart(2,'0') + 
                    String(now.getDate()).padStart(2,'0') + '_' +
                    String(now.getHours()).padStart(2,'0') + 
                    String(now.getMinutes()).padStart(2,'0') + 
                    String(now.getSeconds()).padStart(2,'0');
    const filename = `Placexam_export_${dateStr}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// IMPORTER LES DONNÉES DEPUIS UN JSON ------------------------------------------------------------------------------------------------------------------------------------
function importerDonnees(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Vérifier que les clés existent
            if (!data.tab_etu || !data.tab_filtres_spe || !data.tab_matiere || !data.tab_placement || !data.tab_salles) {
                alert("Le fichier JSON ne contient pas toutes les données nécessaires (tab_salles manquant).");
                return;
            }

            // Remplacer les données
            tab_etu = data.tab_etu;
            tab_filtres_spe = data.tab_filtres_spe;
            tab_matiere = data.tab_matiere;
            tab_placer = data.tab_placement;
            tab_salles = data.tab_salles;

            // Sauvegarder dans localStorage
            sauvegarder("tab_etu", tab_etu);
            sauvegarder("tab_filtres_spe", tab_filtres_spe);
            sauvegarder("tab_matiere", tab_matiere);
            sauvegarder("tab_placement", tab_placer);
            sauvegarder("tab_salles", tab_salles);

            // Rafraîchir l'interface
            if (typeof afficher_listes === "function") afficher_listes();
            if (typeof remplir_select === "function") remplir_select();
            if (typeof generer_filtres === "function") generer_filtres();
            if (typeof verifier_capacite === "function") verifier_capacite();
            if (typeof actualiser_affichage_complet === "function") actualiser_affichage_complet();
            if (typeof recup_placement_enreg === "function") recup_placement_enreg();
            
            // Réinitialiser le placement actuel
            effacer_storage("placer_actuel");
            placement_actuel_donnees = [];

            alert("Import réussi !");
        } catch (error) {
            alert("Erreur lors de l'import : " + error.message);
        }
    };
    reader.readAsText(file);
    // Réinitialiser l'input pour permettre de réimporter le même fichier
    event.target.value = "";
}

// Écouteur pour le bouton export
document.querySelector("#btn-header-export").addEventListener("click", exporterDonnees);
// Écouteur pour le bouton import (déclenche l'input file caché)
document.querySelector("#btn-header-import").addEventListener("click", () => {
    document.getElementById("import-json-input").click();
});
// Écouteur pour l'input file (quand un fichier est sélectionné)
document.getElementById("import-json-input").addEventListener("change", importerDonnees);



//FONCTION POUR GENERER UN NOM UNIQUE (éviter les doublons) -----------------------------------------------------------------------------------------------------------------
function generer_nom_unique(nom_base, tableau_recherche, cle_recherche) {
    let nom_final = String(nom_base).trim();
    let compteur = 1;
    
    // Tant qu'on trouve un élément avec le même nom, on incrémente
    while (tableau_recherche.some(item => item[cle_recherche] === nom_final)) {
        nom_final = `${String(nom_base).trim()}_${compteur}`;
        compteur++;
    }
    return nom_final;
}

// INITIALISATION
remplir_select();
EnregChoix();
if (typeof generer_filtres === "function") generer_filtres();
if (typeof verifier_capacite === "function") verifier_capacite();
