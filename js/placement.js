// GESTION DU PLACEMENT DES ETUDIANTS
//=================================================================================================================================================================

const boite_capacite = document.querySelector(".capacite_max");
const msg_capacite = document.querySelector(".capacite_max div");
const icon_attention = document.querySelector(".svg_attention");
const btn_placement = document.querySelector(".btn-placement");
const conteneur_badges = document.querySelector("#liste_salles_cumulees");
const zone_ajout_salle = document.querySelector(".ajout_salle_sup");
const select_salle_sup = document.querySelector("#select_salle_sup");

// Par défaut, au chargement de la page, le bouton est bloqué
btn_placement.classList.add("placement_disable");
btn_placement.addEventListener("click", placement_aleatoire);

// RÉINITIALISATION DE L'INTERFACE ------------------------------------------------------------------------------------------------
function reinitialiser_etat_ui() {
    boite_capacite.classList.remove("message_visible");
    zone_ajout_salle.classList.remove("message_visible");
    icon_attention.classList.add("svg_attention_invisible");
    btn_placement.classList.remove("placement_disable");
    msg_capacite.innerHTML = "";
    msg_capacite.classList.remove("texte_rouge", "texte_vert");
    select_salle_sup.innerHTML = '<option value="">+ Ajouter une salle</option>';
}

//---------------------------------------------------------------------------------------------------------------------------------------------------------------
// FONCTION POUR VERIFIER LA CAPACITE D'UNE SALLE A CONTENIR TOUT LES ETUDIANTS --------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

function verifier_capacite() {

    if (placement_actuel_donnees && placement_actuel_donnees.length > 0) { //Si on charge une place, alors pas besoin de verifier
        reinitialiser_etat_ui();
        dessiner_badges_salles();
        return;
    }

    const nom_etu = select_etu.value;
    const salle_principale = select_salle.value;

    if (!nom_etu || !salle_principale) {
        btn_placement.classList.add("placement_disable");
        boite_capacite.classList.remove("message_visible");
        zone_ajout_salle.classList.remove("message_visible");
        conteneur_badges.classList.remove("message_visible");
        return;
    }

    // Initialisation de salles_choisies
    if (!salles_choisies.includes(salle_principale)) {
        salles_choisies.unshift(salle_principale);
    }

    // Si un placement est déjà chargé, on ignore
    if (placement_actuel_donnees && placement_actuel_donnees.length > 0) {
        boite_capacite.classList.remove("message_visible");
        zone_ajout_salle.classList.remove("message_visible");
        icon_attention.classList.add("svg_attention_invisible");
        btn_placement.classList.remove("placement_disable");
        dessiner_badges_salles();
        return;
    }

    let listeEtuObj = getListeEtu(nom_etu);
    if (!listeEtuObj) return;
    const specialites_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value);
    let etudiants_a_placer = listeEtuObj.donnees.filter(etu => specialites_actives.includes(etu.specialite));
    let nb_etu = etudiants_a_placer.length;

    if (nb_etu <= 0) {
        btn_placement.classList.add("placement_disable");
        return;
    }

    // Calcul de la capacité totale en utilisant directement salles_choisies
    let capa_totale = 0;
    salles_choisies.forEach(nom_salle => {
        let s_obj = tab_salles.find(s => String(s.nom_salle).trim() === String(nom_salle).trim());
        if (s_obj) {
            let espaces = parseInt(s_obj.sieges_espaces) || 0;
            let bannis = s_obj.places_banni || [];
            let max = parseInt(s_obj.capacite_max) || 0;

            let i = 1;
            while (i <= max) {
                if (!bannis.includes(i)) {
                    capa_totale++;
                    i += espaces + 1;
                } else {
                    i++;
                }
            }
        }
    });

    if (nb_etu > capa_totale) {
        msg_capacite.textContent = `Capacités insuffisantes : ${nb_etu} étudiants pour ${capa_totale} places.`;
        msg_capacite.classList.remove("texte_vert");
        msg_capacite.classList.add("texte_rouge");
        icon_attention.classList.remove("svg_attention_invisible");
        boite_capacite.classList.add("message_visible");
        zone_ajout_salle.classList.add("message_visible");
        btn_placement.classList.add("placement_disable");
        maj_select_salles_sup();
    } else {
        msg_capacite.classList.remove("texte_rouge");
        icon_attention.classList.add("svg_attention_invisible");
        btn_placement.classList.remove("placement_disable");
        zone_ajout_salle.classList.remove("message_visible");

        if (salles_choisies.length > 1) {
            msg_capacite.textContent = `Capacité suffisante : ${nb_etu} étudiants pour ${capa_totale} places.`;
            msg_capacite.classList.add("texte_vert");
            boite_capacite.classList.add("message_visible");
        } else {
            boite_capacite.classList.remove("message_visible");
        }
    }
    dessiner_badges_salles();
    // Ne pas réinitialiser l'affichage si on est sur une salle déjà active
    if (salles_choisies.includes(salle_active)) {
        // garde la salle active actuelle
    } else {
        salle_active = salles_choisies[0] || "";
    }
    btn_plans(salles_choisies);
}



// FONCTION POUR CHARGER UN PLACEMENT ----------------------------------------------------------------------------------------------------------------------------
function charger_placement() {
    if (typeof reinitialiser_etat_ui === "function") reinitialiser_etat_ui();
    const archive = tab_placer[index_edition]; // définit l'archive
    if (!archive) return;
    sauvegarder("placer_actuel", archive.titre);
    const donnees = archive.donnees_placement;

    // DÉDUIRE LA LISTE ÉTUDIANTE (On cherche dans quelle liste se trouve le 1er étudiant)
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
        // On force la récupération prioritaire depuis la sauvegarde locale d'EnregChoix
        const matiere_sauvee = localStorage.getItem("form: select_matiere");
        
        if (matiere_sauvee) {
            select_matiere.value = matiere_sauvee;
        } else {
            //si rien n'est sauvegardé
            const titre_base = archive.titre.split(" - ")[0];
            select_matiere.value = typeof tab_matiere !== "undefined" && tab_matiere.includes(titre_base) ? titre_base : "";
        }
    }

    // 3. DÉDUIRE LES SALLES
    if (archive.salles_choisies && archive.salles_choisies.length > 0) {
        salles_choisies.length = 0;
        salles_choisies.push(...archive.salles_choisies);
        select_salle.value = salles_choisies[0]; 
    }

    if (typeof dessiner_badges_salles === "function") dessiner_badges_salles();
    if (typeof maj_select_salles_sup === "function") maj_select_salles_sup();

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

    // 5. MEMORISER LE PLACEMENT ET AFFICHER
    placement_actuel_donnees = donnees;
    actualiser_affichage_complet(); 

    // 6. BASCULER LA VUE
    document.getElementById("tableau-btn").click();
    
    const charger_sec = document.querySelector(".charger_sec");
    if (charger_sec && charger_sec.classList.contains("sec_open")) {
        // Si oui, on ferme et on retourne au sous-menu
        fermer_formulaire(document.querySelector(".sous_sec"));
    } else {
        fermer_formulaire(); 
    }
}

select_salle_sup.addEventListener("change", (e) => {
    const salle = e.target.value;
    if (salle) {
        if (!salles_choisies.includes(salle)) {
            salles_choisies.push(salle);
        }
        e.target.value = "";
        verifier_capacite();
    }
});
//---------------------------------------------------------------------------------------------------------------------------------------------------------------
// FONCTION POUR CREER LES SELECTIONS DE SALLE SUPPLEMENTAIRE -------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

function maj_select_salles_sup() {
    // 1. On vide le select actuel pour le reconstruire proprement
    select_salle_sup.innerHTML = '<option value="">+ Ajouter une salle</option>';
    
    // 2. On parcourt toutes les salles disponibles
    tab_salles.forEach(s => {
        const nomSalle = String(s.nom_salle || s.nom).trim();
        
        // vérifie si cette salle est déjà dans salles_choisies
        const salles_prise = salles_choisies.some(s_choisie => 
            String(s_choisie).trim() === nomSalle
        );

        if (!salles_prise) {
            creer_option(nomSalle, select_salle_sup);
        }
    });
}
//---------------------------------------------------------------------------------------------------------------------------------------------------------------
// FONCTION POUR AFFICHER LES SALLES SUPPS SELECTIONNE -------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

function dessiner_badges_salles() {
    conteneur_badges.innerHTML = "";

    if (salles_choisies.length <= 1) {
        conteneur_badges.classList.remove("message_visible");
        return;
    }
    
    conteneur_badges.classList.add("message_visible", "liste_salles_cumulees");
    
    // On ignore l'index 0 car c'est la salle principale (non supprimable ici)
    for (let i = 1; i < salles_choisies.length; i++) { 
        const salle_cible = salles_choisies[i]; // On capture la valeur de cette itération
        let badge = document.createElement("div");
        badge.classList.add("badge_salle_sup");
        badge.innerHTML = `
            <span>${salle_cible}</span> 
            <span class="btn_retirer_salle" title="Retirer cette salle">
                <svg width="16" height="16" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="Croix" clip-path="url(#clip0_279_24)">
                        <g id="Vector">
                            <path d="M30 5L5 30ZM5 5L30 30Z" fill="var(--white)"/>
                            <path d="M30 5L5 30M5 5L30 30" stroke="var(--white)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                        <g id="Vector_2">
                            <path d="M30 5L5 30ZM5 5L30 30Z" fill="var(--rouge)"/>
                            <path d="M30 5L5 30M5 5L30 30" stroke="var(--rouge)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                    </g>
                    <defs>
                        <clipPath id="clip0_279_24">
                            <rect width="35" height="35" fill="(--white)"/>
                        </clipPath>
                    </defs>
                </svg>
            </span>
        `;
        
        const btn = badge.querySelector(".btn_retirer_salle");
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // retire la salle concernée
            salles_choisies = salles_choisies.filter(s => s !== salle_cible);
            reset_placement();
            verifier_capacite();
            maj_select_salles_sup();
        });
        conteneur_badges.appendChild(badge);
    }
}

//---------------------------------------------------------------------------------------------------------------------------------------------------------------
// RESET DU PLACEMENT LORSQU'ON CHANGE L'OPTION DANS LES SELECT -----------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

select_etu.addEventListener("change", () => { 
    salles_choisies = [];
    reset_placement();
    verifier_capacite();
});

select_salle.addEventListener("change", () => {
    const newSalle = select_salle.value;
    salles_choisies = salles_choisies.filter(s => s !== newSalle);
    salles_choisies.unshift(newSalle);
    reset_placement();
    verifier_capacite();
    maj_select_salles_sup();
});


window.addEventListener("DOMContentLoaded", () => { 
    setTimeout(verifier_capacite, 200);
});


//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// FONCTION POUR PLACER ALEATOIREMENT LES ETUDIANTS SUR LES PLACES D'EXAMENS -------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function placement_aleatoire() {
    if (btn_placement.classList.contains("placement_disable")) return;

    msg_capacite.textContent = "";
    const nom_liste_etu = select_etu.value;
    const nom_liste_salle = select_salle.value;

    let listeEtuObj = getListeEtu(nom_liste_etu);
    if (!listeEtuObj) return;

    // 1. S'assurer que la salle principale est en tête
    if (salles_choisies.length === 0 || salles_choisies[0] !== select_salle.value) {
        salles_choisies = [select_salle.value];
    }

    const specialites_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value);
    let etudiants_a_placer = listeEtuObj.donnees
        .filter(etu => specialites_actives.includes(etu.specialite))
        .map(etu => ({ ...etu }));

    // 2. Calculer les places disponibles (en parcourant directement salles_choisies)
    let places_dispos = [];

    salles_choisies.forEach(nom_salle => {
        let s_obj = tab_salles.find(s => String(s.nom_salle).trim() === String(nom_salle).trim());
        if (s_obj) {
            let espaces = parseInt(s_obj.sieges_espaces) || 0;
            let bannis = s_obj.places_banni || [];
            let max = parseInt(s_obj.capacite_max) || 0;

            let i = 1;
            while (i <= max) {
                if (!bannis.includes(i)) {
                    places_dispos.push({
                        nom_salle_origine: nom_salle,
                        nom_de_la_place: i
                    });
                    i += espaces + 1;
                } else {
                    i++;
                }
            }
        }
    });

    // 3. Séparer, mélanger et assigner (le reste du code reste identique)
    let etudiants_tiers = [];
    let etudiants_standard = [];

    if (check_tiers_temps && check_tiers_temps.checked) {
        etudiants_tiers = etudiants_a_placer.filter(e => e.tiers_temps);
        etudiants_standard = etudiants_a_placer.filter(e => !e.tiers_temps);
    } else {
        etudiants_standard = [...etudiants_a_placer];
    }

    function melanger(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    melanger(etudiants_tiers);
    melanger(etudiants_standard);
    const etudiants_finaux = [...etudiants_tiers, ...etudiants_standard];

    etudiants_finaux.forEach((etu, index) => {
        if (index < places_dispos.length) {
            etu.salle_attribuee = places_dispos[index].nom_salle_origine;
            etu.place_attribuee = places_dispos[index].nom_de_la_place;
        }
    });

    const lignes_tableau = document.querySelectorAll(".exam-table tbody tr");
    
    // On attribue les places
    Array.from(lignes_tableau).forEach(ligne => {
        //trim() retire les espaces et toLowerCase() met en minuscule
        const tdNom = ligne.cells[0].textContent.trim().toLowerCase(); //Le nom de l'étudiant
        const tdPrenom = ligne.cells[1].textContent.trim().toLowerCase(); //Le prenom de l'étudiant
        const etu = etudiants_finaux.find(e => 
             String(e.nom).trim().toLowerCase() === tdNom && 
             String(e.prenom).trim().toLowerCase() === tdPrenom
        );

        if (etu && etu.place_attribuee) {
            // On sauvegarde les infos de tri
            ligne.dataset.indexSalle = salles_choisies.indexOf(etu.salle_attribuee);
            ligne.dataset.nom = tdNom;
            ligne.dataset.prenom = tdPrenom;
            ligne.dataset.isTiers = etu.tiers_temps ? 1 : 0;

            if (salles_choisies.length > 1) { //Si il y'a plusieurs salles, on affiche en plus le nom de la salle dans lequel la place appartient
                ligne.cells[3].innerHTML = `
                    <div class="place_attribue">${etu.salle_attribuee}</div>
                    <div class="place-number">${etu.place_attribuee}</div>`;
            } else { 
                ligne.cells[3].innerHTML = `<span>${etu.place_attribuee}</span>`; //Sinon on affiche que la place
            }
        } else {
            // Étudiants non placés (sécurité)
            ligne.dataset.indexSalle = 999; 
            ligne.dataset.nom = tdNom;
            ligne.dataset.prenom = tdPrenom;
            ligne.dataset.isTiers = 0;
        }
    });

    const tbody = document.querySelector(".exam-table tbody");
    const lignes_array = Array.from(tbody.querySelectorAll("tr"));

    //le script va classer les places en fonction de l'ordre des salles séléctionné (d'abord la 1ère salle, puis la 2ème, la 3ème...)
    lignes_array.sort((a, b) => {
        let salleA = parseInt(a.dataset.indexSalle);
        let salleB = parseInt(b.dataset.indexSalle);

        if (salleA !== salleB) return salleA - salleB; // Grouper par salle (Amphi 1 avant Amphi 2, etc.)

        // Si les tiers temps doivent être en premier
        if (check_tiers_temps && check_tiers_temps.checked) {
            let tiersA = parseInt(a.dataset.isTiers);
            let tiersB = parseInt(b.dataset.isTiers);
            if (tiersA !== tiersB) return tiersB - tiersA; // Le 1 passe avant le 0
        }

        // Tri Alphabétique par Nom
        if (a.dataset.nom !== b.dataset.nom) {
            return a.dataset.nom.localeCompare(b.dataset.nom);
        }
        return a.dataset.prenom.localeCompare(b.dataset.prenom); // En cas d'homonyme, le tri sera par Prénom
    });
    //réinjecte les lignes dans le tableau
    lignes_array.forEach(ligne => tbody.appendChild(ligne));

    const val_matiere = select_matiere.value; 
    const nom_matiere = val_matiere ? val_matiere : nom_liste_etu;
    const date_jour = new Date().toLocaleDateString(); //met la date et la convertie en chaine de caractère
         
    const titre_salles = salles_choisies.join(' + ');
    const titre_placement = `${nom_matiere} - ${titre_salles} (${date_jour})`;
    
    // On prépare les données
    const donnees_sauvegarde = etudiants_finaux.map(etu => ({
        nom: etu.nom,
        prenom: etu.prenom,
        specialite: etu.specialite,
        tiers_temps: etu.tiers_temps,
        salle_attribuee: etu.salle_attribuee || "Non placé",
        place_attribuee: etu.place_attribuee || "-",
        absent: false // Par défaut, personne n'est absent au moment du placement
    }));

    const spe_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value); //On récupère les filtres cochés
    const tiers_temps_actif = check_tiers_temps ? check_tiers_temps.checked : false; //Si le tier-temps est actif

    // ajoute le placement dans tab_placer
    tab_placer.unshift({
        titre: titre_placement,
        date: date_jour,
        donnees_placement: donnees_sauvegarde,
        salles_choisies: [...salles_choisies],
        filtres: {
            specialites: spe_actives,
            tiers_temps: tiers_temps_actif
        }
    });
    
    sauvegarder('tab_placement', tab_placer);
    sauvegarder('placer_actuel', titre_placement);

    let detail_placement_array = [];
    salles_choisies.forEach(nom_salle => { //affiche le nombre d'étudiants par salles.
        let nb_places_salle = etudiants_finaux.filter(etu => etu.salle_attribuee === nom_salle).length;
        if (nb_places_salle > 0) {
            detail_placement_array.push(`&bull; <b>${nom_salle}</b> : ${nb_places_salle} étudiant(s) placés`);
        }
    });

    let detail_texte_placement = detail_placement_array.join("<br>");

    // 2. On affiche le message de succès détaillé avec du HTML (innerHTML)
    msg_capacite.innerHTML = `${detail_texte_placement}`;
    
    msg_capacite.classList.remove("texte_rouge");
    msg_capacite.classList.add("texte_vert"); 
    icon_attention.classList.add("svg_attention_invisible");
    boite_capacite.classList.add("message_visible");

    colorier_places(donnees_sauvegarde);
    // on rafraîchit la section Historique des placements
    if (label_nom_liste.textContent === "Historique des placements") {
        ouvrir_details_liste("Historique des placements", "historique");
    }
}

//FONCTION POUR MELANGER UNE LISTE (Mélange de Fisher-Yates)
    function melanger(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }