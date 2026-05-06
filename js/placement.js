
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
if (btn_placement) {
    btn_placement.classList.add("placement_disable");
    btn_placement.addEventListener("click", placement_aleatoire);
}

// FONCTION POUR VERIFIER LA CAPACITE D'UNE SALLE A CONTENIR TOUT LES ETUDIANTS ------------------------------------------------------------------------

function verifier_capacite() {
    if (!select_etu || !select_salle) return;

    const nom_etu = select_etu.value;
    const salle_principale = select_salle.value;

    // Si rien n'est sélectionné
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
    if (!listeEtuObj) return;
    const parcours_actifs = Array.from(document.querySelectorAll(".check-parcours:checked")).map(cb => cb.value); //Liste des parcours séléctionnés
    let etudiants_a_placer = listeEtuObj.donnees.filter(etu => parcours_actifs.includes(etu.parcours));
    let nb_etu = etudiants_a_placer.length;

    let capa_totale = 0;
    //On cherche la salle séléctionné et en stocke uniquement les places disponibles
    salles_choisies.forEach(nom => {
        let salleObj = getListeSalle(nom);
        if (salleObj) capa_totale += salleObj.places.filter(p => !p.indisponible).length; 
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
        maj_select_salles_sup(); 

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

function dessiner_badges_salles() {
    conteneur_badges.innerHTML = "";

    if (salles_choisies.length <= 1) {
        conteneur_badges.classList.remove("message_visible");
        return;
    }
    
    conteneur_badges.classList.add("message_visible", "liste_salles_cumulees");
    
    for (let i = 1; i < salles_choisies.length; i++) {
        const nom_de_la_salle = salles_choisies[i]; 
        
        let badge = document.createElement("div");
        badge.classList.add("badge_salle_sup");
        
        badge.innerHTML = `
            <span>${nom_de_la_salle}</span> 
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
        
        badge.querySelector(".btn_retirer_salle").addEventListener("click", () => {
            salles_choisies = salles_choisies.filter(salle => salle !== nom_de_la_salle);
            verifier_capacite();
        });
        conteneur_badges.appendChild(badge);
    }
}

//lorsqu'on sélectionne une liste étudiante ou des salles, ça appel la fonction verifier_capacite()
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
    setTimeout(verifier_capacite, 200); 
});




// FONCTION POUR PLACER ALEATOIREMENT LES ETUDIANTS SUR LES PLACES D'EXAMENS -------------------------------------------------------------------------------------------------

function placement_aleatoire() {
    if (btn_placement.classList.contains("placement_disable")) return; //Sécurité (si le bouton a cette classe, alors il est désactivé).

    msg_capacite.textContent = ""; 

    const nom_liste_etu = select_etu.value;
    const nom_liste_salle = select_salle.value;

    //On cherche la liste étudiante
    let listeEtuObj = getListeEtu(nom_liste_etu);
    if (!listeEtuObj) return;

    const parcours_actifs = Array.from(document.querySelectorAll(".check-parcours:checked")).map(cb => cb.value);
    let etudiants_a_placer = listeEtuObj.donnees.filter(etu => parcours_actifs.includes(etu.parcours));

    let places_dispos = [];
    if(salles_choisies.length === 0) salles_choisies = [nom_liste_salle];

    salles_choisies.forEach(nom_salle => {
        let salleObj = getListeSalle(nom_salle);
        if (salleObj && salleObj.places.length > 0) {
            
            let cle_locale = Object.keys(salleObj.places[0]).find(k => k !== "indisponible");
            
            let places = salleObj.places
                .filter(p => !p.indisponible)
                .map(p => ({ 
                    nom_salle_origine: nom_salle, 
                    nom_de_la_place: p[cle_locale] 
                }));
            
            places_dispos = places_dispos.concat(places);
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

    Array.from(lignes_tableau).forEach(ligne => {
        const tdNom = ligne.cells[0].textContent.trim().toLowerCase();
        const tdPrenom = ligne.cells[1].textContent.trim().toLowerCase();

        const etu = etudiants_finaux.find(e => 
            String(e.nom).trim().toLowerCase() === tdNom && 
            String(e.prenom).trim().toLowerCase() === tdPrenom
        );

        if (etu && etu.place_attribuee) {
            if (salles_choisies.length > 1) {
                ligne.cells[3].innerHTML = `
                    <div style="font-size:0.75rem; color:var(--darkblue); opacity:0.7;">${etu.salle_attribuee}</div>
                    <div class="place-number">${etu.place_attribuee}</div>`;
            } else {
                ligne.cells[3].innerHTML = `<span class="place-number">${etu.place_attribuee}</span>`;
            }
        }
    });
    
    const val_matiere = select_matiere.value; 
    const nom_matiere = val_matiere ? val_matiere : nom_liste_etu;
    const date_jour = new Date().toLocaleDateString();
    
    const titre_salles = salles_choisies.join(' + ');
    const titre_placement = `${nom_matiere} - ${titre_salles} (${date_jour})`;

    const tableau_fini = document.querySelector(".exam-table tbody").innerHTML;

    //On ajoute le placement dans tab_placer
    tab_placer.push({
        titre: titre_placement,
        tableau: tableau_fini
    });
    sauvegarder('tab_placement', tab_placer);

    msg_capacite.textContent = "Placement effectué avec succès !";
    msg_capacite.classList.remove("texte_rouge");
    msg_capacite.classList.add("texte_vert"); 
    icon_attention.classList.add("svg_attention_invisible");
    
    boite_capacite.classList.add("message_visible");
}