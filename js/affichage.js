
//=================================================================================================================================================================
// GESTION DE L'AFFICHAGE DE TABLEAU ET DES FILTRES DYNAMIQUES
//=================================================================================================================================================================

// ECOUTEUR GLOBAL DES FILTRES DE PARCOURS -------------------------------------------------------------------------------------------------------------------------------------
if (conteneur_filtres) {
    conteneur_filtres.addEventListener("change", (e) => {
        if (e.target.classList.contains("check-specialite")) {
            const nomSpecialite = e.target.value; 
            const nom_liste_actuelle = select_etu.value;
            
            if (!tab_filtres_spe[nom_liste_actuelle]) tab_filtres_spe[nom_liste_actuelle] = {};

            tab_filtres_spe[nom_liste_actuelle][nomSpecialite] = e.target.checked;
            sauvegarder('tab_filtres_spe', tab_filtres_spe);

            reset_placement();
            verifier_capacite();
        }
    });
}

// FONCTION POUR REMPLIR LES SELECTIONS -------------------------------------------------------------------------------------------------------------------------------------
function creer_option(element, liste) {
    const option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    liste.appendChild(option);
}

//On rempli les selects
function remplir_select() {
    select_etu.innerHTML = "";
    select_salle.innerHTML = "";
    select_matiere.innerHTML = "";

    Object.values(tab_etu).forEach(liste_etu => { 
        creer_option(liste_etu.nom_fichier, select_etu);
    });
    Object.values(tab_salles).forEach(salle_obj => { 
        creer_option(salle_obj.nom_salle, select_salle); 
    });
    if (select_matiere) {
        Object.values(tab_matiere).forEach(matiere => {
            let affichage = "";
            if (typeof matiere === "string") {
                affichage = matiere;
            } else {
                const nom = matiere.nom || "Inconnu";
                const prof = matiere.prof || "Non renseigné";
                affichage = `${nom} (${prof})`;
            }
            creer_option(affichage, select_matiere);
        });
    }
}

// FONCTION POUR GERER LES FILTRES DE PARCOURS DYNAMIQUE ------------------------------------------------------------------------------------------------------------------
// Les filtres parcours sont générés dynamiquement par rapport à la liste étudiant choisis
const filtres_color = ['#3B82F6', '#EF4444', '#1ac58c', '#F59E0B', '#8B5CF6', '#06B6D4']; //Couleurs des filtres
select_etu.addEventListener("change", () => {
    sauvegarder("select_etu", select_etu.value);
    reset_placement();
    generer_filtres();
});

select_salle.addEventListener("change", () => {
    sauvegarder("select_salle", select_salle.value);
    if (typeof verifier_capacite === "function") verifier_capacite();
});

function generer_filtres() {
    conteneur_filtres.innerHTML = "";
    let liste_select = getListeEtu(select_etu.value);
    
    if (!liste_select) {
        afficher_tableau();
        return;
    }

    const list_specialite = [...new Set(liste_select.donnees.map(etu => etu.specialite))]; //Tableau qui inclut les parcours en retirant les doublons
    const nom_liste_actuelle = select_etu.value; 

    if (!tab_filtres_spe[nom_liste_actuelle]) { //Si les filtres de la liste choisi n'existe pas
        tab_filtres_spe[nom_liste_actuelle] = {};
    }

    list_specialite.forEach((parcours, index) => {
        const couleur = filtres_color[index % filtres_color.length];
        const etatSpecifique = tab_filtres_spe[nom_liste_actuelle][parcours];
        const estCoche = (etatSpecifique === false) ? '' : 'checked';

        const htmlFiltre = `
            <div class="filtre_spe">
                <label class="badge-checkbox" style="--checkcolor: ${couleur}">
                    <input type="checkbox" value="${parcours}" class="check-specialite" ${estCoche}>
                    <span class="badge-text">${parcours}</span>
                    <span class="custom-checkbox"></span>
                </label>
            </div>
        `;
        conteneur_filtres.insertAdjacentHTML("beforeend", htmlFiltre);
    });

    afficher_tableau();
}

//Fonction pour supprimer les filtres de listes qui n'existent plus
function nettoyer_filtres() {
    const noms_listes_existantes = tab_etu.map(liste => liste.nom_fichier);
    for (let nom_liste_sauvegardee in tab_filtres_spe) {
        if (!noms_listes_existantes.includes(nom_liste_sauvegardee)) {
            delete tab_filtres_spe[nom_liste_sauvegardee]; 
        }
    }
    sauvegarder('tab_filtres_spe', tab_filtres_spe);
}

// FONCTON POUR l'AFFICHAGE DU TABLEAU ----------------------------------------------------------------------------------------------------------------------------------
const zero_etu_div = document.querySelector(".zero_etu");

function afficher_tableau() {
    tableau_etu.innerHTML = "";
    
    let donnees_brutes = [];
    
    if (typeof placement_actuel_donnees !== "undefined" && placement_actuel_donnees.length > 0) {
        donnees_brutes = placement_actuel_donnees;
    } else {
        let liste_select = getListeEtu(select_etu.value);
        if (liste_select) {
            donnees_brutes = liste_select.donnees;
        } else {
            zero_etu_div.classList.add("message_visible");
            return; 
        }
    }

    // Filtrage des Spécialités et du Tiers-Temps
    const specialites_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value); 
    const donnees_filtrees = donnees_brutes.filter(etu => specialites_actives.includes(etu.specialite)); 
    const btn_tri_tiers = check_tiers_temps; 

    //Si il y'a aucun étudiants à afficher
    if (donnees_filtrees.length === 0) {
        zero_etu_div.classList.add("message_visible");
    } else {
        zero_etu_div.classList.remove("message_visible");
    }
    
    if (btn_tri_tiers && btn_tri_tiers.checked) {
        donnees_filtrees.sort((a, b) => {
            if (a.tiers_temps && !b.tiers_temps) return -1; 
            if (!a.tiers_temps && b.tiers_temps) return 1; 
            return 0;
        });
    }
    let lignes_html = [];

    donnees_filtrees.forEach((etu) => {
        const tiers_temps = etu.tiers_temps ? svg_tier_temps : "";
        
        // La place est déjà dans "etu" si c'est un placement
        let place_html = "";
        if (etu.place_attribuee && etu.place_attribuee !== "-") {
            if (salles_choisies.length > 1 && etu.salle_attribuee !== "Non placé") {
                place_html = `<div class="place_attribue">${etu.salle_attribuee}</div><div class="place-number">${etu.place_attribuee}</div>`;
            } else {
                place_html = `<span>${etu.place_attribuee}</span>`;
            }
        }

        lignes_html.push(`
            <tr>
                <td>${etu.nom}</td>
                <td>${etu.prenom}</td>
                <td>${etu.specialite}</td>
                <td>${place_html}</td>
                <td class="icon_tiers_temps">${tiers_temps}</td>
                <td>
                    <label class="badge-checkbox">
                        <input type="checkbox" class="check-absence" data-nom="${etu.nom}" data-prenom="${etu.prenom}" ${etu.absent ? "checked" : ""}>
                        <span class="badge-text"></span>
                        <span class="custom-checkbox"></span>
                    </label>
                </td> 
            </tr>
        `);
    });

    document.querySelector(".exam-table tbody").innerHTML = lignes_html.join("");
}


//FONCTION POUR AFFICHER SOIT LE TABLEAU SOIT LE PLAN DE LA SALLE -------------------------------------------------------------------------
const btn_choix_affichage = document.querySelectorAll(".choix_affichage button");
const exam_table = document.querySelector(".exam-table");
const plan_salle = document.querySelector(".plan_salle");
const after_plan = document.querySelector(".after_plan");

btn_choix_affichage.forEach(btn => {
    btn.addEventListener("click", (e) => { 
    
        btn_choix_affichage.forEach(bouton => { 
            bouton.classList.remove("btn_affichage_click");
        });

        if (btn.id === "tableau-btn") { 
            exam_table.classList.remove("affichage_cache");
            plan_salle.classList.add("affichage_cache");
            after_plan.classList.add("affichage_cache");
        } else {
            plan_salle.classList.remove("affichage_cache");
            exam_table.classList.add("affichage_cache");
            after_plan.classList.remove("affichage_cache");
        }

        btn.classList.add("btn_affichage_click");
    });
});

//FONCTION POUR REMPLIR LE CHOIX DES PLANS DE SALLES -------------------------------------------------------------------------------------------------------------------------
const conteneur_btn_plans = document.querySelector(".conteneur_btn-plans_salle");
const conteneur_grilles = document.querySelector(".plan_salles");

function creer_btn_plan(nom_salle) {
    let salleObj = getListeSalle(nom_salle);
    if (!salleObj) return;

    const btn_plan = document.createElement("button");
    btn_plan.className = "btn-plan_salle";
    btn_plan.dataset.salle = nom_salle;
    btn_plan.textContent = nom_salle;
    conteneur_btn_plans.appendChild(btn_plan);

    const grille_salle = document.createElement("section");
    grille_salle.className = "grille_salle";
    grille_salle.dataset.salle = nom_salle;
    grille_salle.style.display = "none";

    let capacite = parseInt(salleObj.capacite_max);
    let rangees = parseInt(salleObj.nbr_rangees);
    let nb_colonnes = Math.ceil(capacite / rangees);
    grille_salle.style.gridTemplateColumns = `repeat(${nb_colonnes}, minmax(15px, 40px))`;

    for (let r = rangees - 1; r >= 0; r--) {
        for (let c = 1; c <= nb_colonnes; c++) {
            let num_place = (r * nb_colonnes) + c;
            
            // Vérifie que la place existe
            if (num_place > capacite) break;

            const place = document.createElement("div");
            place.classList.add("place");
            place.dataset.num_place = num_place;

            const estBannie = salleObj.places_banni && Array.isArray(salleObj.places_banni) && salleObj.places_banni.includes(num_place);

            if (estBannie) {
                place.dataset.etat = "indispo";
                place.classList.add("place_vide");
            } else {
                place.dataset.etat = "vide";
            }
            grille_salle.appendChild(place);
        }
    }
    conteneur_grilles.appendChild(grille_salle);
}

//FONCTION POUR AJOUTER LES BOUTONS DES SALLES DANS LA SECTION PLAN DE SALLE ----------------------------------------------------------------------------------------
function btn_plans(salles) {
    if (!conteneur_btn_plans || !conteneur_grilles) return;

    if (!salles.includes(salle_active)) {
        salle_active = salles[0] || "";
    }
    
    conteneur_btn_plans.innerHTML = "";
    conteneur_grilles.innerHTML = "";
    
    salles.forEach(nom_salle => creer_btn_plan(nom_salle));

    if (!salles.includes(salle_active) || !salle_active) {
        salle_active = salles[0] || "";
    }

    const btnActif = conteneur_btn_plans.querySelector(`[data-salle="${salle_active}"]`);
    const grilleActive = conteneur_grilles.querySelector(`[data-salle="${salle_active}"]`);
    
    if (btnActif && grilleActive) {
        btnActif.classList.add("btn_affichage_click");
        grilleActive.style.display = "grid";
    }
}

// CHANGER DE SALLE AU CLIC SUR LES BOUTONS ------------------------------------------------------------------------------------------------------------------------
    conteneur_btn_plans.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-plan_salle")) {
            const salle_cible = e.target.dataset.salle;
            
            // ✅ Mettre à jour la salle active
            salle_active = salle_cible;

            document.querySelectorAll(".btn-plan_salle").forEach(btn => btn.classList.remove("btn_affichage_click"));
            e.target.classList.add("btn_affichage_click");

            document.querySelectorAll(".grille_salle").forEach(grille => {
                grille.style.display = (grille.dataset.salle === salle_cible) ? "grid" : "none";
            });
        }
    });

// COLORIER LES PLACES APRES LE PLACEMENT ------------------------------------------------------------------------------------------------------------------------
let placement_actuel_donnees = [];

function colorier_places(donnees_placement) {
    placement_actuel_donnees = donnees_placement; 

    document.querySelectorAll(".place").forEach(place => {
        if (place.dataset.etat !== "indispo") {
            place.dataset.etat = "vide";
            place.innerHTML = "";
        }
    });

    donnees_placement.forEach(item => {
        if (item.salle_attribuee !== "Non placé") {
            const grille = document.querySelector(`.grille_salle[data-salle="${item.salle_attribuee}"]`);
            if (grille) {
                const place = grille.querySelector(`.place[data-num_place="${item.place_attribuee}"]`);
                if (place) place.dataset.etat = "prise";

                if (item.absent) {
                        // Priorité à l'absence : On écrit "ABS" en blanc et gras
                        place.innerHTML = `<span>ABS</span>`;
                    } else if (item.tiers_temps) {
                        // Sinon, si l'étudiant est Tiers-temps, on met ton icône
                        place.innerHTML = svg_tier_temps; 
                        place.querySelector("svg").style.fill = "var(--white)";
                    }
            }
        }
    });
}

// AFFICHER LES INFOS D'UNE CHAISE DANS LE BANDEAU
const detail_nom = document.getElementById("detail_nom");
const detail_prenom = document.getElementById("detail_prenom");
const detail_parcours = document.getElementById("detail_parcours");
const detail_place = document.getElementById("detail_place");
const label_absence = document.getElementById("label_absence");

if (conteneur_grilles) {
    conteneur_grilles.addEventListener("click", (e) => {
        const place_cliquee = e.target.closest(".place");
        if (!place_cliquee) return;

        const nom_salle = place_cliquee.closest(".grille_salle").dataset.salle;
        const num_place = parseInt(place_cliquee.dataset.num_place);

        detail_place.textContent = `PLACE ${num_place}`;

        const etu_trouve = placement_actuel_donnees.find(p => p.salle_attribuee === nom_salle && parseInt(p.place_attribuee) === num_place);

        if (etu_trouve && etu_trouve.nom) {
            detail_nom.textContent = etu_trouve.nom;
            detail_prenom.textContent = etu_trouve.prenom;
            detail_parcours.textContent = etu_trouve.specialite || "-";
            label_absence.style.display = "flex"; 
            document.getElementById("check_absence").checked = etu_trouve.absent ? true : false;
        } else {
            detail_nom.textContent = "VIDE";
            detail_prenom.textContent = "-";
            detail_parcours.textContent = "-";
            label_absence.style.display = "none"; 
        }
    });
}


// FONCTION POUR AGRANDIR LE PLAN DE SALLE ------------------------------------------------------------------------------------------------------------------------------
const icon_zoom = document.querySelector(".icon_zoom");
const plan_salle_conteneur = document.querySelector(".plan_salle");

function plan_zoom() {
    plan_salle_conteneur.classList.toggle("zoom_plan");
    fond_sombre.classList.toggle("menu_close");
    icon_zoom.querySelector("svg:first-child").classList.toggle("icon_invisible");
    icon_zoom.querySelector("svg:last-child").classList.toggle("icon_invisible");
    document.body.classList.toggle("no_scroll");
}

icon_zoom.addEventListener("click", plan_zoom);
fond_sombre.addEventListener("click", () => {
    if (plan_salle_conteneur.classList.contains("zoom_plan")) {
        plan_zoom();
    }
});

check_tiers_temps.addEventListener("change", () => {
    reset_placement();
    verifier_capacite();
});

// Fonction unique pour tout réafficher correctement
function actualiser_affichage_complet() {
    afficher_tableau();

    if (placement_actuel_donnees && placement_actuel_donnees.length > 0) {
        const salles_utilisees = [...new Set(placement_actuel_donnees.map(d => d.salle_attribuee))].filter(s => s !== "Non placé");
        btn_plans(salles_utilisees);
        setTimeout(() => {
            colorier_places(placement_actuel_donnees);
            console.log("sa marche !");
        }, 50); 
    }
}

// GESTION DU CLIC POUR DÉSACTIVER/RÉACTIVER LES PLACES
if (conteneur_grilles) {
    conteneur_grilles.addEventListener("click", (e) => {
        const mode_indispo = document.getElementById("mode_indispo");
        if (!mode_indispo || !mode_indispo.checked) return;

        const place = e.target.closest(".place");
        const grille = e.target.closest(".grille_salle");
        
        if (!place || !grille) return;

        // Nettoyage des chaînes pour éviter les erreurs de comparaison (espaces, casse)
        const nomSalle = String(grille.dataset.salle);
        const numPlace = parseInt(place.dataset.num_place);

        console.log(nomSalle);

        // Recherche de la salle
        let salleObj = tab_salles.find(s => String(s.nom_salle).trim() === nomSalle);
        if (!salleObj) return;

        // Si c'est null ou undefined, on force en tableau vide
        if (!salleObj.places_banni || !Array.isArray(salleObj.places_banni)) {
            salleObj.places_banni = [];
        }

        // Gestion des places indisponible
        const index = salleObj.places_banni.indexOf(numPlace);
        if (index > -1) {
            salleObj.places_banni.splice(index, 1);
            place.classList.remove("place_vide");
            place.dataset.etat = "vide";
        } else {
            salleObj.places_banni.push(numPlace); //On enregistre les places banni
            place.classList.add("place_vide");
            place.dataset.etat = "indispo";
            place.innerHTML = "";
        }

        sauvegarder("tab_salles", tab_salles);

        // Sauvegarde immédiate
        if (recuperer("placer_actuel", "") !== "") {
            reset_placement(true);
            // On attend une fraction de seconde pour recolorier les places restantes
            setTimeout(() => {
                if (typeof actualiser_affichage_complet === "function") actualiser_affichage_complet();
            }, 50);
        }
        verifier_capacite();
    });
}

// Écouteur pour select_etu
select_etu.addEventListener("change", () => {
    sauvegarder("select_etu", select_etu.value);
    salles_choisies = [];
    reset_placement();
    generer_filtres();
    verifier_capacite();
});

// Écouteur unique pour select_salle
select_salle.addEventListener("change", () => {
    sauvegarder("select_salle", select_salle.value);
    salles_choisies = [];
    reset_placement();
    verifier_capacite();
});


//ECOUTEUR GLOBAL POUR LES FILTRES
document.addEventListener("change", (e) => {
    if (e.target.classList.contains("check-specialite") || e.target.classList.contains("check_tier")) {
        
        if (recuperer("placer_actuel", "")) {
            effacer_storage("placer_actuel");
            if (typeof placement_actuel_donnees !== "undefined") placement_actuel_donnees = [];
            if (typeof afficher_tableau === "function") afficher_tableau();
        }
        
        if (typeof dessiner_badges_salles === "function") dessiner_badges_salles();
        if (typeof maj_select_salles_sup === "function") maj_select_salles_sup();
        verifier_capacite();
    }
});