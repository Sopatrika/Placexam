// =================================================================================================================================================================
// GESTION DE L'IMPORTATION DE FICHIERS 
//=================================================================================================================================================================


// CONFIGURATION DES IMPORTS ---------------------------------------------------------------------------------------------------------------------------------------
const CONFIG_IMPORT = {
    "import_etudiants": {
        titre: "Mapping - Liste Étudiante",
        champs_requis: [
            { id: "nom", label: "NOM"},
            { id: "prenom", label: "PRÉNOM"},
            { id: "specialite", label: "SPÉCIALITÉ"}
        ],
        formater_donnees: (ligne_excel, map_colonnes) => {
            let etu = {
                nom: ligne_excel[map_colonnes.nom],
                prenom: ligne_excel[map_colonnes.prenom],
                specialite: ligne_excel[map_colonnes.specialite] || "Aucun"
            };
            // On ajoute les autres colonnes comme propriétés bonus de l'étudiant
            for (let key in ligne_excel) {
                if (key !== map_colonnes.nom && key !== map_colonnes.prenom && key !== map_colonnes.specialite) {
                    etu[key] = ligne_excel[key];
                }
            }
            return etu;
        },
        sauvegarder: (cleanData, fileName) => {
            let nom_final = generer_nom_unique(fileName, tab_etu, "nom_fichier");
            tab_etu.unshift({
                nom_fichier: nom_final,
                date_import: new Date().toLocaleDateString(),
                donnees: cleanData
            });
            sauvegarder('tab_etu', tab_etu);
            const verif_etu = document.querySelector("#verif_etu");
            if (verif_etu) verif_etu.textContent = cleanData.length + " étudiants importés avec succès !"; 
        }
    },
    "import_matieres": {
        titre: "Mapping - Liste des Matières",
        champs_requis: [
            { id: "nom", label: "NOM DE LA MATIÈRE"},
            { id: "prof", label: "NOM DU PROFESSEUR"} 
        ],
        formater_donnees: (ligne_excel, map_colonnes) => {
            return {
                nom: ligne_excel[map_colonnes.nom],
                prof: map_colonnes.prof ? ligne_excel[map_colonnes.prof] : "Non renseigné"
            };
        },
        sauvegarder: (cleanData, fileName) => {
            let nb_ajouts = 0;
            cleanData.forEach(mat => {
                if (!tab_matiere.some(m => comparerNoms(m.nom, mat.nom))) {
                    tab_matiere.push(mat);
                    nb_ajouts++;
                }
            });
            sauvegarder('tab_matiere', tab_matiere);
            
            // On cible la div pour afficher le message au lieu de l'alert
            const verif_matiere = document.querySelector("#verif_matiere");
            if (verif_matiere) {
                verif_matiere.textContent = `${nb_ajouts} nouvelles matières importées avec succès !`;
                // Optionnel : on peut forcer la couleur verte de ton CSS
                verif_matiere.style.color = "var(--valide)"; 
            }
        }
    }
};

//FONCTION POUR IMPORTER UN FICHIER EXCEL ------------------------------------------------------------------------------------------------------------------

const importFields = document.querySelectorAll(".import-field");
const allowedExtensions = /(\.xlsx|\.xls|\.csv|\.json)$/i;

importFields.forEach(field => {
    const fileInput = field.querySelector("input[type='file']");
    const fileNameDisplay = field.querySelector(".file-name");
    const btnReset = field.querySelector(".btn-reset");
    const btnSubmit = field.querySelector(".btn-submit");

    const text_defaut = fileNameDisplay.textContent;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name; 
        } else {
            fileNameDisplay.textContent = text_defaut; 
        }
    });

    btnReset.addEventListener('click', () => {
        fileInput.value = ""; 
        fileNameDisplay.textContent = text_defaut;
    });

    btnSubmit.addEventListener('click', () => {
        const file = fileInput.files[0];
        
        if (!file) {
            fileNameDisplay.textContent = "Veuillez mettre un fichier Excel";
            return; 
        }

        if (!allowedExtensions.exec(file.name)) {
            fileNameDisplay.textContent = "Format invalide (.xlsx, .xls, .csv, .json)";
            fileInput.value = '';
            return;
        } 

        conversionExcel(file, fileInput.id); 

        fileInput.value = ""; 
        fileNameDisplay.textContent = text_defaut; 
    });
});

//FONCTION POUR CONVERTIR LE FICHIER EXCEL EN JSON ------------------------------------------------------------------------------------------------------------------------
function conversionExcel(file, inputId) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

        // Vérifie si l'ID de l'input (import_etudiants ou import_matieres) existe dans notre configuration dynamique
        if (CONFIG_IMPORT[inputId]) { 
            let nomFichierPropre = file.name.replace(/\.(xlsx|xls|csv)$/i, ''); // retire l'extension du nom du fichier (.xlsx, .xls, .csv)
            selection_colonnes(headers, rawData, nomFichierPropre, inputId);
        } else {
            console.error("Aucune configuration d'import trouvée pour l'ID : " + inputId);
        }
    };

    reader.readAsArrayBuffer(file);
}

const fond_sombre = document.querySelector('.fond_sombre');
const menu_import = document.querySelector('.menu_import');
const menu_erreur = document.querySelector(".menu_erreur");
const conteneur_selects = document.getElementById("conteneur_selects_mapping");
const titre_menu_mapping = document.getElementById("titre_menu_mapping");

// FONCTION POUR GERER LE MENU MAPPING DYNAMIQUE --------------------------------------------------------------------------------------------
// FONCTION POUR GERER LE MENU MAPPING DYNAMIQUE --------------------------------------------------------------------------------------------
function selection_colonnes(headers, rawData, fileName, inputId) {
    
    const config = CONFIG_IMPORT[inputId];
    
    titre_menu_mapping.textContent = config.titre;
    conteneur_selects.innerHTML = ""; 

    const options_colonnes = '<option value="">-- Choisir --</option>' + 
                        headers.map(h => `<option value="${h}">${h}</option>`).join('');
    
    const memoire_mapping = recuperer(`mapping_memoire_${inputId}`, {});

    config.champs_requis.forEach(champ => {
        const html = `
            <div class="choix_colonnes">
                <span>Quelle colonne correspond à ${champ.label} ? ${champ.optionnel ? "(Optionnel)" : ""}</span>
                <select id="select_map_${champ.id}">${options_colonnes}</select>
            </div>
        `;
        conteneur_selects.insertAdjacentHTML("beforeend", html);
        
        // 🌟 NOUVEAU : Si on a une mémoire pour ce champ, et que la colonne existe toujours dans ce fichier Excel, on la pré-sélectionne
        const select_cree = document.getElementById(`select_map_${champ.id}`);
        if (memoire_mapping[champ.id] && headers.includes(memoire_mapping[champ.id])) {
            select_cree.value = memoire_mapping[champ.id];
        }
    });

    fond_sombre.classList.remove('menu_close');
    menu_import.classList.remove('menu_close');

    window.action_valider_import = () => {
        let map_colonnes = {};
        let erreur = false;

        config.champs_requis.forEach(champ => {
            const val = document.getElementById(`select_map_${champ.id}`).value;
            if (!val && !champ.optionnel) {
                erreur = true; 
            }
            map_colonnes[champ.id] = val;
        });

        if (erreur) {
            menu_erreur.textContent = "Veuillez attribuer une colonne pour chaque champ obligatoire.";
            return;
        }

        let valeurs_selectionnees = Object.values(map_colonnes).filter(v => v !== "");
        let valeurs_uniques = new Set(valeurs_selectionnees);
        
        if (valeurs_uniques.size !== valeurs_selectionnees.length) {
            menu_erreur.textContent = "Les choix des colonnes doivent être différents.";
            return;
        }

        // 🌟 NOUVEAU : On sauvegarde les sélections pour la prochaine fois !
        sauvegarder(`mapping_memoire_${inputId}`, map_colonnes);

        const cleanData = rawData.map(ligne => config.formater_donnees(ligne, map_colonnes));
        config.sauvegarder(cleanData, fileName);

        if (typeof afficher_listes === "function") afficher_listes(); 
        fermer_mapping();
        if (typeof remplir_select === "function") remplir_select(); 
    };
}

// FONCTION POUR FERMER LE MENU MAPPING ---------------------------------------------------------------------------------------------------------------------------------------
function fermer_mapping() {
    fond_sombre.classList.add('menu_close');
    menu_import.classList.add('menu_close');
    menu_erreur.textContent = "";
}



// IMPORTER LES DONNÉES DEPUIS UN JSON ------------------------------------------------------------------------------------------------------------------------------------
function importerDonnees(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Vérifier que les clés existent
            if (!data.tab_etu || !data.tab_filtres_spe || !data.tab_matiere || !data.tab_placement || !data.tab_salles) {
                alert("Le fichier JSON ne contient pas toutes les données nécessaires (tab_salles manquant).");
                return;
            }

            // Remplacer les données
            tab_etu = data.tab_etu;
            tab_filtres_spe = data.tab_filtres_spe;
            tab_matiere = data.tab_matiere;
            tab_placer = data.tab_placement;
            tab_salles = data.tab_salles;

            // Sauvegarder dans localStorage
            sauvegarder("tab_etu", tab_etu);
            sauvegarder("tab_filtres_spe", tab_filtres_spe);
            sauvegarder("tab_matiere", tab_matiere);
            sauvegarder("tab_placement", tab_placer);
            sauvegarder("tab_salles", tab_salles);

            // Rafraîchir l'interface
            if (typeof afficher_listes === "function") afficher_listes();
            if (typeof remplir_select === "function") remplir_select();
            if (typeof generer_filtres === "function") generer_filtres();
            if (typeof verifier_capacite === "function") verifier_capacite();
            if (typeof actualiser_affichage_complet === "function") actualiser_affichage_complet();
            if (typeof recup_placement_enreg === "function") recup_placement_enreg();
            
            // Réinitialiser le placement actuel
            effacer_storage("placer_actuel");
            placement_actuel_donnees = [];

            alert("Import réussi !");
        } catch (error) {
            alert("Erreur lors de l'import : " + error.message);
        }
    };
    reader.readAsText(file);
    // Réinitialiser l'input pour permettre de réimporter le même fichier
    event.target.value = "";
}