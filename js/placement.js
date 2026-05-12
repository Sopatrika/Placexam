
//=================================================================================================================================================================
// GESTION DU PLACEMENT DES ETUDIANTS
//=================================================================================================================================================================


// On cible les éléments du DOM
const boite_capacite = document.querySelector(".capacite_max");
const msg_capacite = document.querySelector(".capacite_max div");
const icon_attention = document.querySelector(".svg_attention");
const btn_placement = document.querySelector(".btn-placement");
const conteneur_badges = document.querySelector("#liste_salles_cumulees");
const zone_ajout_salle = document.querySelector(".ajout_salle_sup");
const select_salle_sup = document.querySelector("#select_salle_sup");

let salles_choisies = []; // Variable pour stocker les salles choisies

// Par défaut, au chargement de la page, le bouton est bloqué
btn_placement.classList.add("placement_disable");
btn_placement.addEventListener("click", placement_aleatoire);

// FONCTION POUR VERIFIER LA CAPACITE D'UNE SALLE A CONTENIR TOUT LES ETUDIANTS ------------------------------------------------------------------------

function verifier_capacite() {
    // Récupère les valeurs dans les deux selections liste étudiants et salles
    const nom_etu = select_etu.value;
    const salle_principale = select_salle.value;

    // Si rien n'est sélectionné dans les selections
    if (!nom_etu || !salle_principale || !nom_etu) {
        btn_placement.classList.add("placement_disable");
        boite_capacite.classList.remove("message_visible");
        zone_ajout_salle.classList.remove("message_visible");
        conteneur_badges.classList.remove("message_visible");
        return;
    }

    if (salles_choisies.length === 0 || salles_choisies[0] !== salle_principale) {
        salles_choisies = [salle_principale];
    }

    let listeEtuObj = getListeEtu(nom_etu); //On recherche la liste étudiante séléctionné
    // if (!listeEtuObj) return;
    const specialites_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value); //Liste des spécialités séléctionnés
    let etudiants_a_placer = listeEtuObj.donnees.filter(etu => specialites_actives.includes(etu.specialite)); //On place les étudiants dont leurs parcours a été coché
    let nb_etu = etudiants_a_placer.length; //Nombre d'étudiant

    let capa_totale = 0;
    
    salles_choisies.forEach(nom => {
        let salleObj = getListeSalle(nom);
        if (salleObj) {
            // récupère l'espacement (0 par défaut)
            let espaces = parseInt(salleObj.sieges_espaces) || 0;
            let pas = espaces + 1; // Si espace = 2, on fait des bonds de 3
            
            // On calcule  les places utilisables
            let places_utilisables = Math.ceil(salleObj.capacite_max / pas); //ceil arrondi vers le haut et retourne le plus petit entier supérieur ou égal à un nombre donné
            capa_totale += places_utilisables; 
            
            // capa_totale += places_utilisables - places_bloquees)
        }
    });

    //Si le nombre d'étudiants est supérieur au nombre de place disponible d'une salle
    if (nb_etu > capa_totale) { 
        msg_capacite.textContent = `Capacités insuffisantes : ${nb_etu} étudiants pour ${capa_totale} places.`;
        msg_capacite.classList.remove("texte_vert");
        msg_capacite.classList.add("texte_rouge");
        icon_attention.classList.remove("svg_attention_invisible");
        
        boite_capacite.classList.add("message_visible");
        zone_ajout_salle.classList.add("message_visible"); 
        btn_placement.classList.add("placement_disable"); 
        maj_select_salles_sup(); //On ajoute un select qui permet d'ajouter des salles

    } else { //Il y'a assez de place
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
}

//FONCTION POUR CREER LES SELECTIONS DE SALLE SUPPLEMENTAIRE
function maj_select_salles_sup() {
    select_salle_sup.innerHTML = '<option value="">+ Ajouter une salle</option>';
    tab_salles.forEach(s => {
        if (!salles_choisies.includes(s.nom_salle)) {
            creer_option(s.nom_salle, select_salle_sup); //On genère les options du select sans prendre en compte les salles déjâ séléctionné
        }
    });
}

//Fonction qui permet d'afficher les salles supp séléctionné
function dessiner_badges_salles() {
    conteneur_badges.innerHTML = "";

    if (salles_choisies.length <= 1) {
        conteneur_badges.classList.remove("message_visible");
        return;
    }
    
    conteneur_badges.classList.add("message_visible", "liste_salles_cumulees");
    
    for (let i = 1; i < salles_choisies.length; i++) { //Pour chaque salle supp, on leur créer un badge
        const salle_actuel = salles_choisies[i]; 
        let badge = document.createElement("div");
        badge.classList.add("badge_salle_sup");
        badge.innerHTML = `
            <span>${salle_actuel}</span> 
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
        
        badge.querySelector(".btn_retirer_salle").addEventListener("click", () => { //On ajoute une croix qui permet de retirer une salle supp
            salles_choisies = salles_choisies.filter(salle => salle !== salle_actuel);
            verifier_capacite();
        });
        conteneur_badges.appendChild(badge);
    }
}

select_etu.addEventListener("change", () => { 
    salles_choisies = []; verifier_capacite(); 
});
select_salle.addEventListener("change", () => {
     salles_choisies = []; verifier_capacite(); 
});

select_salle_sup.addEventListener("change", (e) => {
    if (e.target.value) {
        salles_choisies.push(e.target.value);
        e.target.value = "";
        verifier_capacite(); 
    }
});

window.addEventListener("DOMContentLoaded", () => { 
    setTimeout(verifier_capacite, 200); //On laisse un peu de temps au message pour s'afficher
});




// FONCTION POUR PLACER ALEATOIREMENT LES ETUDIANTS SUR LES PLACES D'EXAMENS -------------------------------------------------------------------------------------------------

function placement_aleatoire() {
    if (btn_placement.classList.contains("placement_disable")) return; //Sécurité (si le bouton a cette classe, alors il est désactivé).

    msg_capacite.textContent = ""; 

    const nom_liste_etu = select_etu.value;
    const nom_liste_salle = select_salle.value;

    //On cherche la liste étudiante
    let listeEtuObj = getListeEtu(nom_liste_etu);
    // if (!listeEtuObj) return;

    //cherche les specialités qui sont cochés dans les filtres
    const specialites_actives = Array.from(document.querySelectorAll(".check-specialite:checked")).map(cb => cb.value); //Les parcours qui ont été séléctonné
    let etudiants_a_placer = listeEtuObj.donnees
    .filter(etu => specialites_actives.includes(etu.specialite))
    .map(etu => ({ ...etu }));

    let places_dispos = [];
    if(salles_choisies.length === 0) salles_choisies = [nom_liste_salle];

    //  génère les numéros de places
    salles_choisies.forEach(nom_salle => {
        let salleObj = getListeSalle(nom_salle);
        if (salleObj) {
            // crée des places de 1 jusqu'à la capacité max
            for (let i = 1; i <= salleObj.capacite_max; i++) {
                // (Plus tard : on ajoutera un IF ici pour vérifier que 'i' n'est pas dans salleObj.places_banni)
                places_dispos.push({
                    nom_salle_origine: nom_salle, 
                    nom_de_la_place: i
                });
            }
        }
    });
    let etudiants_tiers = [];
    let etudiants_standard = [];

    //Si le Checkbox "tiers-temps en premier" est coché, alors on place en premier les étudiants en tier-temps dans le tableau
    if (check_tiers_temps && check_tiers_temps.checked) {
        etudiants_tiers = etudiants_a_placer.filter(e => e.tiers_temps);
        etudiants_standard = etudiants_a_placer.filter(e => !e.tiers_temps);
    } else {
        etudiants_standard = [...etudiants_a_placer];
    }

    //FONCTION POUR MELANGER UNE LISTE (Mélange de Fisher-Yates)
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

    // ajoute le placement dans tab_placer
    tab_placer.push({
        titre: titre_placement,
        date: date_jour,
        donnees_placement: donnees_sauvegarde
    });
    
    sauvegarder('tab_placement', tab_placer);

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
    
    boite_capacite.classList.add("message_visible");
}