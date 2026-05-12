
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


const btn_creer_salle = document.querySelector(".btn_creer-salle");
const input_nom_salle = document.getElementById("nom_salle");
const input_nbr_places = document.getElementById("nbr_places");
const input_nbr_rangees = document.getElementById("nbr_rangees");
const input_sieges_espaces = document.getElementById("sieges_espaces"); 

// FONCTION POUR CREER UNE SALLE ----------------------------------------------------------------------------

if (btn_creer_salle) {
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
        let nom_final = nom;
        let compteur = 1;
        
        // On ajoute "_x" à la salle
        while (tab_salles.some(salle => salle.nom_salle === nom_final)) {
            nom_final = `${nom}_${compteur}`;
            compteur++;
        }

        // Création du nouvel objet Salle
        const nouvelle_salle = {
            nom_salle: nom_final,
            capacite_max: places,
            nbr_rangees: rangees,
            sieges_espaces: espaces,
            places_banni: null
        };

        tab_salles.push(nouvelle_salle);
        sauvegarder("tab_salles", tab_salles)

        // Confirmation
        verif_message.textContent = `La salle "${nom_final}" a été générée avec succès !`;
        verif_message.style.color = "var(--valide)";

        // On vide les champs pour la prochaine salle
        input_nom.value = "";
        input_places.value = "";
        input_rangees.value = "";
        input_espaces.value = ""; // ou "2" si tu veux remettre ta valeur par défaut

        // 7. Mise à jour du menu gauche (si la fonction existe dans ce fichier)
        if (typeof afficher_listes === "function") {
            afficher_listes(); 
        }
    });
}


//FONCTION POUR SAUVEGARDER LES INPUT COCHER ET LES SELECTIONS ----------------------------------------------------------------------------------
function EnregChoix() {
    const formElements = document.querySelectorAll('input[type="checkbox"], input[type="time"], .selects_table select');
    
    formElements.forEach(element => {
        if (!element.id) return;
        
        const storageKey = "form: "+ element.id;
        const savedValue = localStorage.getItem(storageKey); 
        
        if (savedValue !== null) {
            if (element.type === 'checkbox') {
                element.checked = (savedValue === 'true');
            } else {
                element.value = savedValue; 
            }
        }

        element.addEventListener('change', () => {
            const val = (element.type === 'checkbox') ? element.checked : element.value;
            localStorage.setItem(storageKey, val); 
        });
    });
}

