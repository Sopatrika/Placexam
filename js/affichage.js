
//=================================================================================================================================================================
// GESTION DE L'AFFICHAGE DE TABLEAU ET DES FILTRES DYNAMIQUES
//=================================================================================================================================================================

// FONCTION POUR LES FILTRES DE SPECIALITE -------------------------------------------------------------------------------------------------------------------------------------
function maj_filtre_specialite(checkbox) {
    const nomSpecialite = checkbox.value; 
    const nom_liste_actuelle = select_etu.value;
    
    if (!tab_filtres_spe[nom_liste_actuelle]) tab_filtres_spe[nom_liste_actuelle] = {}; //Si le filtre n'existe pas, on le supprime

    tab_filtres_spe[nom_liste_actuelle][nomSpecialite] = checkbox.checked; //enregistre si la case est coché
    sauvegarder('tab_filtres_spe', tab_filtres_spe);

    reset_placement(true); 
    verifier_capacite();
}

// FONCTION POUR REMPLIR LES SELECTIONS -------------------------------------------------------------------------------------------------------------------------------------
function creer_option(texte_a_afficher, liste_html, valeur = texte_a_afficher) {
    const option = document.createElement("option");
    option.value = valeur;
    option.textContent = texte_a_afficher;
    liste_html.appendChild(option);
}

//FONCTION POUR REMPLIR LES SELECTS DU TABLEAU ------------------------------------------------------------------------------------------------------------------------------
function remplir_select() {
    // récupère directement depuis la clé unique du formulaire
    let ancienne_etu = recuperer("form:select_etu", "");
    let ancienne_salle = recuperer("form:select_salle", "");
    let ancienne_matiere = recuperer("form:select_matiere", "");

    if (typeof select_etu !== "undefined") select_etu.innerHTML = "";
    if (typeof select_salle !== "undefined") select_salle.innerHTML = "";
    if (typeof select_matiere !== "undefined" && select_matiere) select_matiere.innerHTML = "";

    // Vérification Liste Étudiants
    if (!tab_etu || tab_etu.length === 0) {
        creer_option("(aucune données)", select_etu, ""); 
    } else {
        tab_etu.forEach(liste_etu => { creer_option(liste_etu.nom_fichier, select_etu); });
    }

    // Vérification Salles
    if (!tab_salles || tab_salles.length === 0) {
        creer_option("(aucune données)", select_salle, "");
    } else {
        tab_salles.forEach(salle_obj => { creer_option(salle_obj.nom_salle, select_salle); });
    }

    // Vérification Matières
    if (typeof select_matiere !== "undefined" && select_matiere) {
        if (!tab_matiere || tab_matiere.length === 0) {
            creer_option("(aucune données)", select_matiere, "");
        } else {
            tab_matiere.forEach(matiere => {
                let affichage = typeof matiere === "string" ? matiere : `${matiere.nom || "Inconnu"} (${matiere.prof || "Non renseigné"})`;
                creer_option(affichage, select_matiere);
            });
        }
    }

    // Étudiants
    if (ancienne_etu && Array.from(select_etu.options).some(opt => opt.value === ancienne_etu)) {
        select_etu.value = ancienne_etu;
    } else if (select_etu.options.length > 0 && select_etu.options[0].value !== "") {
        select_etu.value = select_etu.options[0].value;
        sauvegarder("form:select_etu", select_etu.value);
    }

    // Salles
    if (ancienne_salle && Array.from(select_salle.options).some(opt => opt.value === ancienne_salle)) {
        select_salle.value = ancienne_salle;
    } else if (select_salle.options.length > 0 && select_salle.options[0].value !== "") {
        select_salle.value = select_salle.options[0].value;
        sauvegarder("form:select_salle", select_salle.value);
    }

    // Matières
    if (typeof select_matiere !== "undefined" && select_matiere) {
        if (ancienne_matiere && Array.from(select_matiere.options).some(opt => opt.value === ancienne_matiere)) {
            select_matiere.value = ancienne_matiere;
        } else if (select_matiere.options.length > 0 && select_matiere.options[0].value !== "") {
            select_matiere.value = select_matiere.options[0].value;
            sauvegarder("form:select_matiere", select_matiere.value);
        }
    }

    // Sécurité : Si aucune salle n'est encore dans le tableau des salles choisies, on y met la salle principale
    if (typeof salles_choisies !== "undefined" && salles_choisies.length === 0 && select_salle.value) {
        salles_choisies = [select_salle.value];
    }

    // EXÉCUTION SYSTÉMATIQUE ET DIRECTE POUR TOUT AFFICHER
    // generer_filtres() appelle automatiquement afficher_tableau() à la fin de son exécution !
    if (typeof generer_filtres === "function") generer_filtres(); 
    if (typeof verifier_capacite === "function") verifier_capacite();
}

// FONCTION POUR GERER LES FILTRES DE PARCOURS DYNAMIQUE ------------------------------------------------------------------------------------------------------------------
// Les filtres parcours sont générés dynamiquement par rapport à la liste étudiant choisis
const filtres_color = ['#3B82F6', '#EF4444', '#1ac58c', '#F59E0B', '#8B5CF6', '#06B6D4']; //Couleurs des filtres

function generer_filtres() {
    conteneur_filtres.innerHTML = "";
    let liste_select = getListeEtu(select_etu.value); //Recupère la liste d'étudiant séléctionné
    
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
    
    let nom_parcours = parcours || "sans specialite"; 
        //Crée le filtre
        const filtre = `
            <div class="filtre_spe">
                <label class="badge-checkbox" style="--checkcolor: ${couleur}">
                    <input type="checkbox" value="${parcours}" class="check-specialite" ${estCoche}>
                    <span class="badge-text">${nom_parcours}</span>
                    <span class="custom-checkbox"></span>
                </label>
            </div>
        `;
        conteneur_filtres.insertAdjacentHTML("beforeend", filtre); //injecte le filtre
    });

    afficher_tableau();
}

//FONCTION POUR SUPPRIMER LES FILTRES QUI N'EXISTENT PLUS -------------------------------------------------------------------------------------------------------------------
function nettoyer_filtres() {
    const noms_listes_existantes = tab_etu.map(liste => liste.nom_fichier);
    for (let nom_liste_sauvegardee in tab_filtres_spe) {
        if (!noms_listes_existantes.includes(nom_liste_sauvegardee)) {
            delete tab_filtres_spe[nom_liste_sauvegardee]; //Supprime le filtre de tab_filtres_spe
        }
    }
    sauvegarder('tab_filtres_spe', tab_filtres_spe);
}

// FONCTION POUR l'AFFICHAGE DU TABLEAU ----------------------------------------------------------------------------------------------------------------------------------
const zero_etu_div = document.querySelector(".zero_etu");

function afficher_tableau() {
    tableau_etu.innerHTML = "";
    
    let donnees_brutes = [];
    let messages_vide = []; // Tableau pour stocker les messages personnalisés
    
    // Si il n'y a pas de salle dans tab_salles
    if (!tab_salles || tab_salles.length === 0) {
        messages_vide.push("Aucune salle disponible");
    }

    if (typeof placement_actuel_donnees !== "undefined" && placement_actuel_donnees.length > 0) {
        donnees_brutes = placement_actuel_donnees;
    } else {
        let liste_select = getListeEtu(select_etu.value);
        if (liste_select) {
            donnees_brutes = liste_select.donnees;
        }
    }

    // Filtrage des Spécialités et du Tiers-Temps
    const specialites_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value); 
    const donnees_filtrees = donnees_brutes.filter(etu => specialites_actives.includes(etu.specialite)); 
    const btn_tri_tiers = check_tiers_temps; 

    // Si il n'y a pas d'étudiants
    if (donnees_filtrees.length === 0) {
        messages_vide.push("Aucun étudiants à afficher");
    }
    
    // Affichage dans zero_etu
    if (messages_vide.length > 0) {
        //joint les messages avec un retour à la ligne s'il y en a plusieurs
        zero_etu_div.innerHTML = `<h4>${messages_vide.join("<br><br>")}</h4>`;
        zero_etu_div.classList.add("message_visible");
        tbody.innerHTML = ""; //vide le tableau de sécurité
        return; //arret puisqu'il n'y a rien à afficher
    } else {
        zero_etu_div.classList.remove("message_visible");
    }
    //Si les tiers-temps doivent être en premier sur la liste ou pas
    if (btn_tri_tiers.checked) {
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
        let place_attribue = "";
        if (etu.place_attribuee && etu.place_attribuee !== "-") {
            let place_alpha = convertir_place_alpha(etu.place_attribuee, etu.salle_attribuee); // Conversion !
            if (salles_choisies.length > 1 && etu.salle_attribuee !== "Non placé") {
                place_attribue = `<div class="place_attribue">${etu.salle_attribuee}</div><div class="place-number">${place_alpha}</div>`;
            } else {
                place_attribue = `<span>${place_alpha}</span>`;
            }
        }
        //Ajout de l'étudiant dans le tableau
        lignes_html.push(`
            <tr>
                <td>${echapperHTML(etu.nom)}</td>
                <td>${echapperHTML(etu.prenom)}</td>
                <td>${echapperHTML(etu.specialite)}</td>
                <td>${place_attribue}</td>
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

    tbody.innerHTML = lignes_html.join("");
}


//FONCTION POUR AFFICHER SOIT LE TABLEAU SOIT LE PLAN DE LA SALLE -------------------------------------------------------------------------
const btn_choix_affichage = document.querySelectorAll(".choix_affichage button");
const exam_table = document.querySelector(".exam-table");
const plan_salle = document.querySelector(".plan_salle");
const after_plan = document.querySelector(".after_plan");

function basculer_affichage(btn_clique) {
    btn_choix_affichage.forEach(b => b.classList.remove("btn_affichage_click"));
    
    if (btn_clique.id === "tableau-btn") { //Si c'est le bouton tableau
        exam_table.classList.remove("affichage_cache");
        plan_salle.classList.add("affichage_cache");
        after_plan.classList.add("affichage_cache");
    } else { //Si c'est Salle
        plan_salle.classList.remove("affichage_cache");
        exam_table.classList.add("affichage_cache");
        after_plan.classList.remove("affichage_cache");
    }
    btn_clique.classList.add("btn_affichage_click");
}

//FONCTION POUR REMPLIR LE CHOIX DES PLANS DE SALLES -------------------------------------------------------------------------------------------------------------------------
const conteneur_btn_plans = document.querySelector(".conteneur_btn-plans_salle");
const conteneur_grilles = document.querySelector(".plan_salles");

function creer_btn_plan(nom_salle) {
    let salleObj = getListeSalle(nom_salle);

    // Création du bouton de la salle
    const btn_plan = document.createElement("button");
    btn_plan.className = "btn-plan_salle";
    btn_plan.dataset.salle = nom_salle;
    
    if (!salleObj) { //Si la salle a été supprimé, on affiche un message "supprimé"
        btn_plan.textContent = `${nom_salle} (Supprimé)`;
        btn_plan.style.color = "var(--rouge)";
        btn_plan.style.borderColor = "var(--rouge)";
    } else {
        btn_plan.textContent = nom_salle;
    }
    conteneur_btn_plans.appendChild(btn_plan);

    // Création du plan de la salle
    const grille_salle = document.createElement("section");
    grille_salle.className = "grille_salle";
    grille_salle.dataset.salle = nom_salle;
    grille_salle.style.display = "none";

    // Si la salle n'existe plus, on affiche un message d'erreur
    if (!salleObj) {
        grille_salle.style.display = "block"; //
        grille_salle.innerHTML = `
            <div class="erreur_plan_salle">
                <h4>
                    Le plan de <b>${nom_salle}</b> n'est plus disponible car la salle a été supprimée de vos listes.
                </h4>
            </div>
        `;
        conteneur_grilles.appendChild(grille_salle);
        return; 
    }

    // Si la salle existe
    let capacite = parseInt(salleObj.capacite_max); //Nombre de place de la salle
    let rangees = parseInt(salleObj.nbr_rangees); //Nombre de rangée de la salle
    let nb_colonnes = Math.ceil(capacite / rangees); //Nombre de colonne de la salle
    grille_salle.style.gridTemplateColumns = `repeat(${nb_colonnes}, minmax(15px, 40px))`;

    //On crée les places
    for (let r = rangees - 1; r >= 0; r--) {
        // part de nb_colonnes et descend jusqu'à 1 pour inverser le sens
        for (let c = nb_colonnes; c >= 1; c--) {
            let num_place = (r * nb_colonnes) + c;
            
            const place = document.createElement("div");
            let place_alpha = convertir_place_alpha(num_place, nom_salle); // Conversion !
            place.innerText = place_alpha;

            // Vérifie que la place ne dépasse pas la capacité max
            if (num_place > capacite) {
                place.classList.add("place");
                place.style.visibility = "hidden";
                grille_salle.appendChild(place);
                continue; 
            }

            place.classList.add("place");
            place.dataset.num_place = num_place; // On garde le nombre pour la logique des bannis
            place.dataset.alpha = place_alpha;

            // Vérifie si la place est indisponible
            const place_indispo = salleObj.places_banni && Array.isArray(salleObj.places_banni) && salleObj.places_banni.includes(num_place);
            if (place_indispo) {
                place.dataset.etat = "indispo";
                place.classList.add("place_vide"); //ajoute une classe aux sièges vides.
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
    if (!conteneur_btn_plans || !conteneur_grilles) return; //Si il y'a pas de plan de salle

    conteneur_btn_plans.innerHTML = "";
    conteneur_grilles.innerHTML = "";
    
    // Si il y'a pas de salles
    if (!salles || salles.length === 0 || (salles.length === 1 && salles[0] === "")) {
        conteneur_grilles.innerHTML = `<div class="erreur_plan_salle"><h4>Aucun plan de salle à afficher</h4></div>
        `;
        return;
    }

    if (!salles.includes(salle_active)) {
        salle_active = salles[0] || "";
    }
    
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
function changer_salle_plan(btn) {
    const salle_cible = btn.dataset.salle;
    salle_active = salle_cible;

    document.querySelectorAll(".btn-plan_salle").forEach(b => b.classList.remove("btn_affichage_click"));
    btn.classList.add("btn_affichage_click");
    
    document.querySelectorAll(".grille_salle").forEach(grille => {
        grille.style.display = (grille.dataset.salle === salle_cible) ? "grid" : "none";
    });
}

// COLORIER LES PLACES APRES LE PLACEMENT ------------------------------------------------------------------------------------------------------------------------
let placement_actuel_donnees = [];

function colorier_places(donnees_placement) {
    placement_actuel_donnees = donnees_placement; 

    const places = document.querySelectorAll(".place");
    places.forEach(place => {
        if (place.dataset.etat !== "indispo") {
            place.dataset.etat = "vide";
            // remet le numéro de la place avec la lettre !
            if (place.dataset.alpha) {
                place.innerHTML = place.dataset.alpha;
            } else {
                place.innerHTML = ""; 
            }
        }
    });
    //On colorie chaque place
    donnees_placement.forEach(item => {
    if (item.salle_attribuee !== "Non placé") {
        const grille = document.querySelector(`.grille_salle[data-salle="${item.salle_attribuee}"]`);
        if (grille) {
            const place = grille.querySelector(`.place[data-num_place="${item.place_attribuee}"]`);
            if (place) {
                place.dataset.etat = "prise";
                let place_alpha = convertir_place_alpha(item.place_attribuee, item.salle_attribuee); // Conversion !
                let contenuHTML = `<span>${place_alpha}</span>`;
                
                // ajoute des badges selon l'état
                if (item.absent) { 
                    contenuHTML += `<span class="abs">ABS</span>`;
                } else if (item.tiers_temps) { 
                    contenuHTML += `<span class="place_tiers_temps">${svg_tier_temps}</span>`;
                }
                
                place.innerHTML = contenuHTML;
            }
        }
    }
});
}

// AFFICHER LES INFOS D'UNE PLACE DANS LE BANDEAU -----------------------------------------------------------------------------------------------
const detail_nom = document.getElementById("detail_nom");
const detail_prenom = document.getElementById("detail_prenom");
const detail_parcours = document.getElementById("detail_parcours");
const detail_place = document.getElementById("detail_place");
const label_absence = document.getElementById("label_absence");

function gerer_clic_place(place) {
    const ancienne_place = document.querySelector(".place_cliquer");
    if (ancienne_place) {
        ancienne_place.classList.remove("place_cliquer"); // retire la classe à l'ancienne place cliqué
    }
    place.classList.add("place_cliquer"); // ajoute la classe à la place cliqué

    const grille = place.closest(".grille_salle");
    const nom_salle = grille.dataset.salle;
    const num_place = parseInt(place.dataset.num_place);
    const num_alpha = convertir_place_alpha(num_place, nom_salle); // Conversion

    // "Mode Indisponible" activé (pour rendre indisponible des places)
    if (mode_indispo && mode_indispo.checked) {
        let salleObj = tab_salles.find(s => String(s.nom_salle).trim() === String(nom_salle).trim());
        if (!salleObj) return;
        if (!salleObj.places_banni || !Array.isArray(salleObj.places_banni)) salleObj.places_banni = [];

        const index = salleObj.places_banni.indexOf(num_place);
        if (index > -1) {
            salleObj.places_banni.splice(index, 1);
            place.classList.remove("place_vide");
            place.dataset.etat = "vide";
        } else {
            salleObj.places_banni.push(num_place);
            place.classList.add("place_vide");
            place.dataset.etat = "indispo";
            place.innerHTML = "";
        }
        sauvegarder("tab_salles", tab_salles);

        if (recuperer("placer_actuel", "") !== "") {
            reset_placement(true);
            setTimeout(() => {
                if (typeof actualiser_affichage_complet === "function") actualiser_affichage_complet();
            }, 50);
        }
        verifier_capacite();
        return; // On arrête là si on était en mode édition
    }

    //détails (si le mode indisponible est désactivé)
    document.getElementById("detail_place").textContent = `PLACE ${num_alpha}`;
    const etu_trouve = placement_actuel_donnees.find(p => p.salle_attribuee === nom_salle && parseInt(p.place_attribuee) === num_place);

    if (etu_trouve && etu_trouve.nom) { //On met les informations de l'étudiant placé sur cette place
        document.getElementById("detail_nom").textContent = etu_trouve.nom;
        document.getElementById("detail_prenom").textContent = etu_trouve.prenom;
        document.getElementById("detail_parcours").textContent = etu_trouve.specialite || "-";
        document.getElementById("label_absence").style.display = "flex"; 
        document.getElementById("check_absence").checked = etu_trouve.absent ? true : false;
    } else { 
        document.getElementById("detail_nom").textContent = "VIDE";
        document.getElementById("detail_prenom").textContent = "-";
        document.getElementById("detail_parcours").textContent = "-";
        document.getElementById("label_absence").style.display = "none"; 
    }
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

// Fonction pour tout réafficher
function actualiser_affichage_complet() {
    afficher_tableau();

    if (placement_actuel_donnees && placement_actuel_donnees.length > 0) {
        const salles_utilisees = [...new Set(placement_actuel_donnees.map(d => d.salle_attribuee))].filter(s => s !== "Non placé");
        btn_plans(salles_utilisees);
        setTimeout(() => {
            colorier_places(placement_actuel_donnees);
        }, 50); 
    }
}