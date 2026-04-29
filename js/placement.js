// On cible la boîte globale pour afficher/cacher, et le div pour le texte
const boite_capacite = document.querySelector(".capacite_max");
const msg_capacite = document.querySelector(".capacite_max div");
const btn_placement = document.querySelector(".btn-placement");

if (btn_placement) {
    btn_placement.addEventListener("click", placement_aleatoire);
}

//FONCTION POUR PLACER ALEATOIREMENT LES ETUDIANTS SUR LES PLACES D'EXAMENS -----------------------------------

function placement_aleatoire() {
    msg_capacite.textContent = ""; 
    boite_capacite.style.display = "none"; // On cache le message par défaut

    // On recupère les options séléctonné dans les select
    const nom_liste_etu = document.querySelector("#liste_etus").value;
    const nom_liste_salle = document.querySelector("#liste_salles").value;

    if (!nom_liste_etu || !nom_liste_salle || nom_liste_etu === "Matiere") {
        msg_capacite.textContent = "Veuillez sélectionner une liste d'étudiants et une salle.";
        boite_capacite.style.display = "flex";
        return;
    }

    let listeEtuObj = tab_etu.find(l => l.nom_fichier === nom_liste_etu);
    let listeSalleObj = tab_salles.find(l => l.nom_salle === nom_liste_salle);

    if (!listeEtuObj || !listeSalleObj) return;

    // On récupère les étudiants tout en filtrant (les étudiants d'un parcours non cochés ne sont pas comptabilisé)
    const parcours_actifs = Array.from(document.querySelectorAll(".check-parcours:checked")).map(cb => cb.value);
    let etudiants_a_placer = listeEtuObj.donnees.filter(etu => parcours_actifs.includes(etu.parcours));

    // 3. On récupère les places disponibles
    let places_dispos = listeSalleObj.places.filter(p => !p.indisponible);

    // Si la salle a une capacité inférieur au nombre d'étudiant, un message d'erreur s'affiche
    if (etudiants_a_placer.length > places_dispos.length) {
        msg_capacite.textContent = `Erreur : Trop d'étudiants (${etudiants_a_placer.length}) pour le nombre de places (${places_dispos.length}).`;
        boite_capacite.style.display = "flex";
        return; 
    }

    const cle_place = Object.keys(places_dispos[0]).find(k => k !== "indisponible");

    // Gestion du Filtre Tiers-temps
    const check_tiers_temps = document.querySelector(".tri_tiers_temps");
    let etudiants_tiers = [];
    let etudiants_standard = [];

    //Si le filtre "Tiers temps en premier" est coché, alors on place les étudiants en tiers temps en premier dans la liste
    if (check_tiers_temps && check_tiers_temps.checked) {
        etudiants_tiers = etudiants_a_placer.filter(e => e.tiers_temps);
        etudiants_standard = etudiants_a_placer.filter(e => !e.tiers_temps);
    } else {
        etudiants_standard = [...etudiants_a_placer];
    }

    // On coupe la liste des places en gardant l'ordre exact
    let places_pour_tiers = places_dispos.splice(0, etudiants_tiers.length); 
    let places_pour_standard = places_dispos; 

    // Fonction pour mélanger les places (en utilisant le mélange de Fisher-Yates)
    function melanger(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    melanger(places_pour_tiers);
    melanger(places_pour_standard);

    const etudiants_finaux = [...etudiants_tiers, ...etudiants_standard];
    const places_finales = [...places_pour_tiers, ...places_pour_standard];

    const lignes_tableau = document.querySelectorAll(".exam-table tbody tr");

    //On attribue les places aux étudiants
    places_finales.forEach((place, index) => {
        if (index < etudiants_finaux.length) {
            const etu = etudiants_finaux[index];
            const nom_de_la_place = place[cle_place];

            const ligneEtu = Array.from(lignes_tableau).find(ligne => {
                const tdNom = ligne.cells[0].textContent.trim().toLowerCase();
                const tdPrenom = ligne.cells[1].textContent.trim().toLowerCase();
                const dataNom = String(etu.nom).trim().toLowerCase();
                const dataPrenom = String(etu.prenom).trim().toLowerCase();
                
                return tdNom === dataNom && tdPrenom === dataPrenom;
            });

            ligneEtu.cells[3].innerHTML = `<span class="place-number">${nom_de_la_place}</span>`;
        }
    });
    
    // 8. SAUVEGARDE AUTOMATIQUE DANS L'HISTORIQUE
    const select_matiere = document.querySelector("#liste_matiere").value;
    const nom_matiere = (select_matiere && select_matiere !== "Matiere") ? select_matiere : nom_liste_etu;
    const date_jour = new Date().toLocaleDateString();
    
    // On crée un joli nom (ex: "Chimie - Amphi 1 (27/04/2026)")
    const titre_placement = `${nom_matiere} - ${nom_liste_salle} (${date_jour})`;

    // On récupère le code HTML du tableau qu'on vient juste de remplir
    const html_tableau_fini = document.querySelector(".exam-table tbody").innerHTML;

    // On enregistre le placement dans le tableau des placements
    tab_placer.push({
        titre: titre_placement,
        html_du_tableau: html_tableau_fini
    });
    
    // On met à jour le LocalStorage
    localStorage.setItem('tab_placement', JSON.stringify(tab_placer));
}