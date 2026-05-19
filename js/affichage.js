
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
            
            placement_actuel_donnees = []; 
            afficher_tableau();
            if (typeof verifier_capacite === "function") verifier_capacite(); // Met à jour le texte de capacité
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
    if (select_matiere) select_matiere.innerHTML = "";

    Object.values(tab_etu).forEach( liste_etu => { 
        creer_option(liste_etu.nom_fichier, select_etu);
    });
    Object.values(tab_salles).forEach( salle_obj => { 
        creer_option(salle_obj.nom_salle, select_salle); 
    });
    if (select_matiere) {
        Object.values(tab_matiere).forEach(matiere => { 
            creer_option(matiere, select_matiere);
        });
    }
}

// FONCTION POUR GERER LES FILTRES DE PARCOURS DYNAMIQUE ------------------------------------------------------------------------------------------------------------------
// Les filtres parcours sont générés dynamiquement par rapport à la liste étudiant choisis
const filtres_color = ['#3B82F6', '#EF4444', '#1ac58c', '#F59E0B', '#8B5CF6', '#06B6D4']; //Couleurs des filtres
select_etu.addEventListener("change", generer_filtres);

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
            return; 
        }
    }

    // Filtrage des Spécialités et du Tiers-Temps
    const specialites_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value); 
    const donnees_filtrees = donnees_brutes.filter(etu => specialites_actives.includes(etu.specialite)); 
    const btn_tri_tiers = check_tiers_temps; 
    
    if (btn_tri_tiers && btn_tri_tiers.checked) {
        donnees_filtrees.sort((a, b) => {
            if (a.tiers_temps && !b.tiers_temps) return -1; 
            if (!a.tiers_temps && b.tiers_temps) return 1; 
            return 0;
        });
    }

    const svg_sablier = `<svg class="icon_tiers-temps" width="16" height="20" viewBox="0 0 16 20"><use href="#icon-sablier"></use></svg>`;
    let lignes_html = [];

    donnees_filtrees.forEach((etu) => {
        const tiers_temps = etu.tiers_temps ? svg_sablier : "";
        
        // 🟢 BEAUCOUP PLUS SIMPLE : La place est déjà dans "etu" si c'est un placement !
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
                    <label class="badge-checkbox" style="--checkcolor: var(--black);">
                        <input type="checkbox" class="check-absence" data-nom="${etu.nom}" data-prenom="${etu.prenom}">
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

    // 1. Le bouton
    const btn_plan = document.createElement("button");
    btn_plan.className = "btn-plan_salle";
    btn_plan.dataset.salle = nom_salle;
    btn_plan.textContent = nom_salle;
    conteneur_btn_plans.appendChild(btn_plan);

    // 2. La grille
    const grille_salle = document.createElement("section");
    grille_salle.className = "grille_salle";
    grille_salle.dataset.salle = nom_salle;
    grille_salle.style.display = "none";

    // Sécurité maximale avec parseInt
    let capacite = parseInt(salleObj.capacite_max); 
    let rangees = parseInt(salleObj.nbr_rangees);

    let nb_colonnes = Math.ceil(capacite / rangees);
    grille_salle.style.gridTemplateColumns = `repeat(${nb_colonnes}, minmax(15px, 40px))`;

    // 3. Les chaises
    for (let r = rangees - 1; r >= 0; r--) { // On part de la rangée du haut vers celle du bas
        for (let c = 1; c <= nb_colonnes; c++) { // On va de gauche à droite
            
            // Le calcul mathématique de la place
            let num_place = (r * nb_colonnes) + c;

            const place = document.createElement("div"); 
            place.className = "place";
            
            if (num_place <= capacite) {
                // C'est une vraie place !
                place.dataset.num_place = num_place;
                place.dataset.etat = "vide"; 
                place.title = `Place n°${num_place}`;

                if (salleObj.places_banni && salleObj.places_banni.includes(num_place)) {
                    place.dataset.etat = "indispo";
                }
            } else {
                place.style.visibility = "hidden";
            }
            
            grille_salle.appendChild(place);
        }
    }
    conteneur_grilles.appendChild(grille_salle);
}

function btn_plans(salles) {
    if (!conteneur_btn_plans || !conteneur_grilles) return;
    
    conteneur_btn_plans.innerHTML = ""; 
    conteneur_grilles.innerHTML = ""; 
    
    salles.forEach(nom_salle => creer_btn_plan(nom_salle));

    // Activation visuelle de la première salle
    if (conteneur_btn_plans.firstChild) {
        conteneur_btn_plans.firstChild.classList.add("btn_affichage_click");
        conteneur_grilles.firstChild.style.display = "grid";
    }
}

// CHANGER DE SALLE AU CLIC SUR LES BOUTONS ------------------------------------------------------------------------------------------------------------------------
    conteneur_btn_plans.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-plan_salle")) {
            const salle_cible = e.target.dataset.salle;

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
        if (place.dataset.etat !== "indispo") place.dataset.etat = "vide";
    });

    donnees_placement.forEach(item => {
        if (item.salle_attribuee !== "Non placé") {
            const grille = document.querySelector(`.grille_salle[data-salle="${item.salle_attribuee}"]`);
            if (grille) {
                const place = grille.querySelector(`.place[data-num_place="${item.place_attribuee}"]`);
                if (place) place.dataset.etat = "prise";
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

// FONCTION POUR CHARGER UN PLACEMENT -----------------------------------------------------------------------------------------------------------------------------------

function valider_chargement() {
    const archive = tab_placer[index_edition];
    if (!archive) return;
    const donnees = archive.donnees_placement;

    // 1. DÉDUIRE LA LISTE ÉTUDIANTE (On cherche dans quelle liste se trouve le 1er étudiant)
    if (donnees.length > 0) {
        const premier_etu = donnees[0];
        const liste_trouvee = Object.values(tab_etu).find(liste => 
            liste.donnees.some(e => e.nom === premier_etu.nom && e.prenom === premier_etu.prenom)
        );
        select_etu.value = liste_trouvee ? liste_trouvee.nom_fichier : "";
    } else {
        select_etu.value = "";
    }

    // 2. DÉDUIRE LA MATIÈRE (Depuis le titre de l'archive)
    if (select_matiere) {
        const titre_base = archive.titre.split(" - ")[0];
        select_matiere.value = tab_matiere.includes(titre_base) ? titre_base : "";
    }

    // 3. DÉDUIRE LES SALLES
    salles_choisies.length = 0; // On vide le tableau global des salles
    
    if (archive.salles_selectionnees) {
        archive.salles_selectionnees.forEach(s => {
            if (getListeSalle(s)) salles_choisies.push(s);
        });
    } else {
        // Fallback de sécurité si c'est une vieille sauvegarde sans cette info
        const salles_archive = [...new Set(donnees.map(d => d.salle_attribuee))].filter(s => s !== "Non placé");
        salles_archive.forEach(s => {
            if (getListeSalle(s)) salles_choisies.push(s);
        });
    }

    select_salle.value = (salles_choisies.length > 0) ? salles_choisies[0] : "";
    if (typeof dessiner_badges_salles === "function") dessiner_badges_salles();

    // 4. METTRE A JOUR LES FILTRES (Spécialités et Tiers-Temps)
    if (select_etu.value) {
        if (!tab_filtres_spe[select_etu.value]) tab_filtres_spe[select_etu.value] = {};
        
        // On désactive toutes les spécialités par défaut
        for (let s in tab_filtres_spe[select_etu.value]) {
            tab_filtres_spe[select_etu.value][s] = false;
        }
        
        // On réactive uniquement celles qui étaient cochées le jour du placement
        if (archive.filtres && archive.filtres.specialites) {
            archive.filtres.specialites.forEach(spe => {
                tab_filtres_spe[select_etu.value][spe] = true;
            });
        } 
        // (Sécurité : si c'est un très vieux placement fait avant cette mise à jour)
        else {
            const spe_archive = [...new Set(donnees.map(d => d.specialite))];
            spe_archive.forEach(spe => { tab_filtres_spe[select_etu.value][spe] = true; });
        }
        
        sauvegarder('tab_filtres_spe', tab_filtres_spe);
        generer_filtres(); // Refait les badges visuels
    }
    
    // 4. METTRE A JOUR LES FILTRES (Spécialités et Tiers-Temps)
    if (select_etu.value) {
        if (!tab_filtres_spe[select_etu.value]) tab_filtres_spe[select_etu.value] = {};
        
        // On désactive toutes les spécialités par défaut
        for (let s in tab_filtres_spe[select_etu.value]) {
            tab_filtres_spe[select_etu.value][s] = false;
        }
        
        // On réactive uniquement celles qui étaient cochées le jour du placement
        if (archive.filtres && archive.filtres.specialites) {
            archive.filtres.specialites.forEach(spe => {
                tab_filtres_spe[select_etu.value][spe] = true;
            });
        } 
        else {
            const spe_archive = [...new Set(donnees.map(d => d.specialite))];
            spe_archive.forEach(spe => { tab_filtres_spe[select_etu.value][spe] = true; });
        }
        
        sauvegarder('tab_filtres_spe', tab_filtres_spe);
        generer_filtres(); 
    }

    // 5. MEMORISER LE PLACEMENT ET AFFICHER
    placement_actuel_donnees = donnees;

    if (typeof verifier_capacite === "function") verifier_capacite();
    
    afficher_tableau(); 
    if (typeof btn_plans === "function") btn_plans(salles_choisies);
    if (typeof colorier_places === "function") colorier_places(donnees);

    // 6. BASCULER LA VUE ET FERMER LE MENU
    document.getElementById("tableau-btn").click();
    fermer_formulaire(document.querySelector(".sous_sec"));
}

if (check_tiers_temps) {
    check_tiers_temps.addEventListener("change", () => {
        placement_actuel_donnees = []; 
        afficher_tableau();
        if (typeof verifier_capacite === "function") verifier_capacite();
    });
}

// INITIALISATION ---
remplir_select();
EnregChoix();
generer_filtres();