//=============================================================================
// GESTION DES ECOUTEURS GLOBAL DE L'APPLICATION WEB (CLIC, SELECTION, ETC...)
//=============================================================================

const EventManager = {
    init() {
        this.bindGlobalClicks();
        this.bindGlobalChanges();
        this.bindGlobalInputs();
        this.bindWindowEvents();
        this.bindCustomEvents();
    },

    bindGlobalClicks() {
        document.addEventListener("click", (e) => {
            const target = e.target;

            switch (true) {
                // --- MENU GAUCHE ---
                case !!target.closest(".button_menu_gauche"):
                    document.querySelector(".menu_listes").classList.toggle("menu_open");
                    break;
                
                case !!target.closest(".btn-section-menu"):
                    gerer_onglets_menu_gauche(target.closest(".btn-section-menu"));
                    break;

                case !!target.closest(".nom_texte"):
                    const li = target.closest("li");
                    section_precedente = target.closest("section");
                    ouvrir_details_liste(li.dataset.name, li.dataset.type);
                    break;

                case !!target.closest(".return_sec"):
                    fermer_formulaire(section_precedente);
                    break;

                // --- ACTIONS CRUD ---
                case !!target.closest(".trash_element"):
                    supprimer(target.closest(".trash_element"));
                    break;

                case !!target.closest(".rename_element"):
                    preparer_edition_element(target.closest(".rename_element"));
                    break;

                // Ajoute le reste de tes cas ici avec la même logique : case !!target.closest(".ta_classe"):
                // ...
                case !!target.closest(".btn_ajouter"):
                    mode_edition = "ajouter";
                    index_edition = -1;
                    edition_formulaire();
                    break;
                case !!target.closest(".load_element"):
                    preparer_chargement_placement(e.target.closest(".load_element"));
                    break;
                case !!target.closest(".btn_supp_historique"):
                    if (typeof supp_histo_placement === "function") supp_histo_placement();
                    break;
                case !!target.closest(".btn_creer-salle"):
                    creer_nouvelle_salle();
                    break;
                case !!target.closest(".groupe_btn > *"):
                    gerer_boutons_action(e);
                    break;
                case !!target.closest(".btn-placement"):
                    if (typeof placement_aleatoire === "function") placement_aleatoire();
                    break;
                case !!target.closest(".btn_affichage"):
                    basculer_affichage(e.target.closest(".btn_affichage"));
                    break;
                case !!target.closest(".btn-plan_salle"):
                    changer_salle_plan(e.target.closest(".btn-plan_salle"));
                case !!target.closest(".place"):
                    gerer_clic_place(e.target.closest(".place"));
                    break;
                case !!target.closest(".icon_zoom"):
                case !!target.closest(".fond_sombre"):
                case !!target.closest(document.querySelector(".plan_salle").classList.contains("zoom_plan")):
                    plan_zoom();
                    break;
                // --- HEADER & IMPORT/EXPORT ---
                case !!target.closest("#btn-header-import"):
                    document.getElementById("import-json-input").click();
                    break;
                case !!target.closest(".btn-exporter"): // <-- C'est lui qui manquait !
                    ouvrir_menu_export();
                    break;
                case !!target.closest(".btn-reset"):
                    reinitialiser_champ_import(e.target.closest(".import-field"));
                    break;
                case !!target.closest(".btn-submit"):
                    valider_champ_import(e.target.closest(".import-field"));
                    break;
                case !!target.closest("#btn-header-export"):
                    exporterDonnees();
                    break;
                // --- POPUP ABSENCE ---
                case !!target.closest(".remove_popup"):
                    document.querySelector(".popup_absence").classList.remove("pop");
                    break;
                case !!target.closest(".btn_absence"):
                    creer_liste_absents();
                    break;
                
            }
        });
    },

    bindGlobalChanges() {
        document.addEventListener("change", (e) => {
            const target = e.target;

            // 1. D'abord on gère les cas basés sur l'ID (Switch classique)
            switch (target.id) {
                case "select_etu":
                case "select_salle":
                    sauvegarder(target.id, target.value);
                    if (target.id === "select_etu") {
                        salles_choisies = [];
                        reset_placement();
                        generer_filtres();
                    } else {
                        salles_choisies = [target.value];
                        reset_placement();
                        maj_select_salles_sup();
                    }
                    verifier_capacite();
                    return; // On arrête l'exécution ici

                case "select_salle_sup":
                    if (target.value && !salles_choisies.includes(target.value)) {
                        salles_choisies.push(target.value);
                        verifier_capacite();
                    }
                    target.value = "";
                    return;

                case "tri_tiers_temps":
                    reset_placement(true);
                    verifier_capacite();
                    return;

                case "check_absence":
                    synchro_absence_plan(target.checked);
                    return;

                case "import-json-input":
                    importerDonnees(e);
                    return;
            }

            // 2. Ensuite on gère les classes avec un switch(true)
            switch (true) {
                case target.classList.contains("check-specialite"):
                    maj_filtre_specialite(target);
                    break;
                case target.classList.contains("check-absence"):
                    maj_absences();
                    break;
                case target.classList.contains("check_tier") || target.classList.contains("check_indispo"):
                    maj_option_etudiant(target);
                    break;
                case target.matches(".import-field input[type='file']"):
                    maj_nom_fichier_import(target);
                    break;
            }
        });
    },

    bindGlobalInputs() { //Input
        document.addEventListener("input", (e) => {
            if (e.target.id === "search_etu") {
                rechercher_dans_menu(e.target.value);
            }
        });
    },

    bindWindowEvents() { //Chargement
        window.addEventListener('load', () => {
            recup_placement_enreg();
            setTimeout(() => {
                if (typeof placement_actuel_donnees !== "undefined" && placement_actuel_donnees.length > 0) {
                    if (typeof colorier_places === "function") colorier_places(placement_actuel_donnees);
                }
            }, 300);
        });
    },

    bindCustomEvents() { //évenement custom
        document.addEventListener("donneesMisesAJour", (e) => {
            rafraichir_menu_apres_maj(e.detail.type);
        });
    }
};

// Lancement
document.addEventListener("DOMContentLoaded", () => {
    EventManager.init();
    afficher_listes(); 
});