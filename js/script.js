
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

// ECOUTEUR GLOBAL DES CLICS -----------------------------------------------------------
document.addEventListener("click", (e) => {
    
    // OUVRIR UNE SOUS-LISTE
    if (e.target.classList.contains("nom_texte")) {
        const li = e.target.closest("li");
        const type_liste = li.dataset.type;
        section_precedente = e.target.closest("section"); 
        ouvrir_details_liste(li.dataset.name, type_liste);
    }
    
    // CLIC SUR BOUTON RETOUR
    else if (e.target.closest(".return_sec")) {
        fermer_formulaire(section_precedente);
    }

    // CLIC SUR SUPPRIMER
    else if (e.target.closest(".trash_element")) {
        supprimer(e.target.closest(".trash_element")); 
    }

    // CLIC SUR MODIFIER
    else if (e.target.closest(".rename_element")) {
        const bloc = e.target.closest(".bloc_element"); 
        const liListe = e.target.closest(".menu_ul > li"); 
        
        if (bloc) {
            index_edition = parseInt(bloc.dataset.index, 10);
            mode_edition = "modifier";
            edition_formulaire();
        } else if (liListe) {
            const isEtu = e.target.closest(".etu_sec") !== null;
            type_edition = isEtu ? "nom_liste_etu" : "nom_liste_salle";
            index_edition = Array.from(liListe.parentNode.children).indexOf(liListe);
            ancien_nom_liste = liListe.dataset.name;
            mode_edition = "modifier_liste";
            edition_formulaire();
        }
    }

    // CLIC POUR AJOUTER
    else if (e.target.closest(".btn_ajouter")) {
        mode_edition = "ajouter";
        index_edition = -1;
        edition_formulaire();
    }

    else if (e.target.closest(".load_element")) {
        const bloc = e.target.closest(".bloc_element");
        if (bloc) {
            // On mémorise quel placement l'utilisateur veut charger
            index_edition = parseInt(bloc.dataset.index, 10); 
            
            // On cache la liste et on ouvre la section de confirmation de chargement
            document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
            document.querySelector(".charger_sec").classList.add("sec_open");
        }
    }

    else if (e.target.dataset.action === "edition_annul") {
        edition_erreur.textContent = "";
        let selecteur_retour = (mode_edition === "modifier_liste") ? ".etu_sec" : CONFIG_SECTION[type_edition]?.section_retour;
        fermer_formulaire(document.querySelector(selecteur_retour));
    }
    else if (e.target.dataset.action === "charger_annul") {
        fermer_formulaire(document.querySelector(".sous_sec"));
    }
    else if (e.target.dataset.action === "import_annul") {
        fermer_mapping();
    }

    // ------------------ ROUTEUR DES BOUTONS VALIDER ------------------
    else if (e.target.dataset.action === "edition_valid") {
        valider_edition();
    }
    else if (e.target.dataset.action === "charger_valid") {
        valider_chargement();
    }
    else if (e.target.dataset.action === "import_valid") {
        action_valider_import();
    }
});

// FONCTION POUR GENERER LES BOUTONS ANNULER ET VALIDER -----------------------------------------------------------------------------------------------
function injecter_boutons() {
    document.querySelectorAll(".groupe_btn[data-action]").forEach(zone => {
        const action = zone.dataset.action; 
    
        zone.innerHTML = `
            <div class="btn_annuler" data-action="${action}_annul">Annuler</div>
            <div class="btn_valider" data-action="${action}_valid">Valider</div>
        `;
    });
}

injecter_boutons();


const btn_creer_salle = document.querySelector(".btn_creer-salle");
const input_nom_salle = document.getElementById("nom_salle");
const input_nbr_places = document.getElementById("nbr_places");
const input_nbr_rangees = document.getElementById("nbr_rangees");
const input_sieges_espaces = document.getElementById("sieges_espaces"); 

// FONCTION POUR CREER UNE SALLE -------------------------------------------------------------------------------------------------------------------

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

        // Création d'un nouvelle objet salle
        const nouvelle_salle = {
            nom_salle: nom_final,
            capacite_max: places,
            nbr_rangees: rangees,
            sieges_espaces: espaces,
            places_banni: null
        };

        tab_salles.push(nouvelle_salle);
        sauvegarder("tab_salles", tab_salles)

        // Message de confirmation
        verif_message.textContent = `La salle "${nom_final}" a été générée avec succès !`;
        verif_message.style.color = "var(--valide)";

        // vide les champs pour la prochaine salle
        input_nom.value = "";
        input_places.value = "";
        input_rangees.value = "";
        input_espaces.value = "";

        effacer_storage("form: nom_salle");
        effacer_storage("form: nbr_places");
        effacer_storage("form: nbr_rangees");
        effacer_storage("form: sieges_espaces");

        //  Mise à jour du menu gauche
        afficher_listes(); 
    });
}


//FONCTION POUR SAUVEGARDER LES INPUT COCHER ET LES SELECTIONS ----------------------------------------------------------------------------------
function EnregChoix() {
    const formElements = document.querySelectorAll('input[type="checkbox"], input[type="time"], .selects_table select, .form_salle input');
    
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

        element.addEventListener('input', () => {
            const val = (element.type === 'checkbox') ? element.checked : element.value;
            localStorage.setItem(storageKey, val); 
        });
    });
}

