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
                // Ouvrir/fermer le menu gauche
                case !!target.closest(".button_menu_gauche"):
                    document.querySelector(".menu_listes").classList.toggle("menu_open");
                    break;
                // Ouvrir une section
                case !!target.closest(".btn-section-menu"):
                    gerer_onglets_menu_gauche(target.closest(".btn-section-menu"));
                    break;
                // Ouvrir un sous menu
                case !!target.closest(".nom_texte"):
                    const li = target.closest("li");
                    section_precedente = target.closest("section");
                    ouvrir_details_liste(li.dataset.name, li.dataset.type);
                    break;
                // Revenir sur la section liste d'étudiant
               case !!target.closest(".return_sec"):
                    const label_type = document.querySelector(".nom_liste");
                    if (label_type && label_type.dataset.type) {
                        const type_l = label_type.dataset.type;
                        const sec_cible = type_l === "salle" ? ".salle_sec" : (type_l === "matiere" ? ".matiere_sec" : (type_l === "historique" ? ".historique_sec" : ".etu_sec"));
                        // Ferme tout et ouvre la bonne section racine
                        document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
                        document.querySelector(sec_cible).classList.add("sec_open");
                    }
                    break;
                // Clic sur la corbeille ppour supprimer
                case !!target.closest(".trash_element"):
                    supprimer(target.closest(".trash_element"));
                    break;
                // Clic sur le crayon pour modifier
                case !!target.closest(".rename_element"):
                    preparer_edition_element(target.closest(".rename_element"));
                    break;
                // Clic sur Ajouter
                case !!target.closest(".btn_ajouter"):
                    mode_edition = "ajouter";
                    index_edition = -1;
                    edition_formulaire();
                    break;
                //Clic pour charger une sauvegarde
                case !!target.closest(".load_element"):
                    preparer_chargement_placement(e.target.closest(".load_element"));
                    break;
                // Clic pour vider l'histo des chargements
                case !!target.closest(".btn_supp_historique"):
                    if (typeof supp_histo_placement === "function") supp_histo_placement();
                    break;
                //Crée une salle
                case !!target.closest(".btn_creer-salle"):
                    creer_nouvelle_salle();
                    break;
                //Bouton annuler et valider
                case !!target.closest(".groupe_btn > *"):
                    gerer_boutons_action(e);
                    break;
                //Faire un placement
                case !!target.closest(".btn-placement"):
                    if (typeof placement_aleatoire === "function") placement_aleatoire();
                    break;
                //ouvrir tableau ou plan de salle
                case !!target.closest(".btn_affichage"):
                    basculer_affichage(e.target.closest(".btn_affichage"));
                    break;
                //Afficher un plan de salle de la salle cliqué
                case !!target.closest(".btn-plan_salle"):
                    changer_salle_plan(e.target.closest(".btn-plan_salle"));
                //Clic sur une place
                case !!target.closest(".place"):
                    gerer_clic_place(e.target.closest(".place"));
                    break;
                //Clic sur l'icone zoom
                case !!target.closest(".icon_zoom"):
                case !!target.closest(".fond_sombre"):
                case !!target.closest(document.querySelector(".plan_salle").classList.contains("zoom_plan")):
                    plan_zoom();
                    break;
                // --- HEADER & IMPORT/EXPORT ---
                //Clic sur le bouton d'import dans le header
                case !!target.closest("#btn-header-import"):
                    document.getElementById("import-json-input").click();
                    break;
                //Clic sur le bouton d'export dans le header
                case !!target.closest("#btn-header-export"):
                    exporterDonnees();
                    break;
                //Clic sur exporter
                case !!target.closest(".btn-exporter"):
                    ouvrir_menu_export();
                    break;
                //Clic pour reset l'import
                case !!target.closest(".btn-reset"):
                    reinitialiser_champ_import(e.target.closest(".import-field"));
                    break;
                //Valider
                case !!target.closest(".btn-submit"):
                    valider_champ_import(e.target.closest(".import-field"));
                    break;
                // Enlever le popup d'absence
                case !!target.closest("#remove_pop_absence"):
                    document.querySelector(".popup_absence").classList.remove("pop");
                    break;
                // Mettre absent 
                case !!target.closest(".btn_absence"):
                    creer_liste_absents();
                    break;
                //Enlever le menu d'import JSON
                case !!target.closest("#remove_menujson"):
                    document.querySelector(".menu_import_donnees").classList.remove("pop");
                    break;
                
            }
        });
    },

    bindGlobalChanges() {
        document.addEventListener("change", (e) => {
            const target = e.target;

            // gère les cas basés sur l'ID
            switch (target.id) {
                //selection des listes étudiant(e)s et salle
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
                    return;
                //selection dans salles supplémentaire
                case "select_salle_sup":
                    if (target.value && !salles_choisies.includes(target.value)) {
                        salles_choisies.push(target.value);
                        verifier_capacite();
                    }
                    target.value = "";
                    return;
                    //Case tiers-temps
                case "tri_tiers_temps":
                    reset_placement(true);
                    verifier_capacite();
                    return;
                // Case absence
                case "check_absence":
                    synchro_absence_plan(target.checked);
                    return;
                    //Case import en json
                case "import-json-input":
                    importerDonnees(e);
                    return;
            }

            // gère les classes
            switch (true) {
                //Filtre des spécialités
                case target.classList.contains("check-specialite"):
                    maj_filtre_specialite(target);
                    break;
                //Case pour absence
                case target.classList.contains("check-absence"):
                    maj_absences();
                    break;
                //Case pour place indisponible
                case target.classList.contains("check_tier") || target.classList.contains("check_indispo"):
                    maj_option_etudiant(target);
                    break;
                //Importation
                case target.matches(".import-field input[type='file']"):
                    maj_nom_fichier_import(target);
                    break;
            }
        });
    },

    bindGlobalInputs() { //Barre de recherche
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