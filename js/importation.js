
// =================================================================================================================================================================
// GESTION DE L'IMPORTATION DE FICHIERS 
//=================================================================================================================================================================


//FONCTION POUR IMPORTER UN FICHIER EXCEL ------------------------------------------------------------------------------------------------------------------

const importFields = document.querySelectorAll(".import-field");
const allowedExtensions = /(\.xlsx|\.xls|\.csv|\.json)$/i;

importFields.forEach(field => {
    const fileInput = field.querySelector("input[type='file']");
    const fileNameDisplay = field.querySelector(".file-name");
    const btnReset = field.querySelector(".btn-reset");
    const btnSubmit = field.querySelector(".btn-submit");

    const text_defaut = fileNameDisplay.textContent;// On sauvegarde le texte par défaut

    // quand on met le fichier, son nom apparait 
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name; 
        } else {
            fileNameDisplay.textContent = text_defaut; 
        }
    });

    // Pour supprimer le fichier avec la croix
    btnReset.addEventListener('click', () => {
        fileInput.value = ""; 
        fileNameDisplay.textContent = text_defaut;
    });

    // On Clique sur OK
    btnSubmit.addEventListener('click', () => {
        const file = fileInput.files[0];
        
        if (!file) { 
            fileNameDisplay.textContent = "Veuillez mettre un fichier Excel"; 
            return; 
        }

        if (!allowedExtensions.exec(file.name)) {
            fileNameDisplay.textContent = "Format invalide (.xlsx, .xls, .csv, .json uniquement)";
            fileInput.value = '';
            return;
        } 

        conversionExcel(file, fileInput.id); 

        fileInput.value = ""; 
        fileNameDisplay.textContent = text_defaut; 
    });
});




//FONCTION POUR CONVERTIR LE FICHIER EXCEL EN JSON
function conversionExcel(file, inputId) {
    
    const reader = new FileReader();// FileReader est un outil natif du navigateur pour lire les fichiers locaux

    reader.onload = (e) => { //Lorsqu'un fichier arrive
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];// On extrait la première ligne pour avoir le nom des colonne

        if (inputId === "import_etudiants") { // selon le bouton sur lequel on a cliqué
            selection_colonnes(headers, rawData, file.name); // On lance le menu de mapping pour les étudiants
        } 
        else if (inputId === "import_salles") {
            sauvegarderSalles(rawData, file.name); //on sauvegarde directement sans menu mapping
        }
    };

    reader.readAsArrayBuffer(file);
}



const selectNom = document.getElementById('select_nom');
const selectPrenom = document.getElementById('select_prenom');
const selectParcours = document.getElementById('select_parcours');
const fondSombre = document.querySelector('.fond_sombre');
const menuImport = document.querySelector('.menu_import_etu');
const menu_erreur = document.querySelector(".menu_erreur");
const verif_etu = document.querySelector("#verif_etu");
const verif_salle = document.querySelector("#verif_salle");

// FONCTION POUR GERER LE MENU MAPPING
// Cette fonction permet de choisir quel colonnes correspond à quel noms (NOM, PRENOM, PARCOURS).
function selection_colonnes(headers, rawData, fileName) {

    //Remplir les select avec les colonnes trouvées dans l'Excel
    const options_colonnes = '<option value="">-- Choisir --</option>' + 
                        headers.map(h => `<option value="${h}">${h}</option>`).join('');
    
    selectNom.innerHTML = options_colonnes;
    selectPrenom.innerHTML = options_colonnes;
    selectParcours.innerHTML = options_colonnes;

    // Affiche le menu
    fondSombre.classList.remove('menu_import_close');
    menuImport.classList.remove('menu_import_close');

    document.getElementById('menu_import_annul').onclick = () => {
        fermerMenuMapping();
    };

    // gère la validation
    document.getElementById('menu_import_valid').onclick = () => {
        // On récupère le choix de l'utilisateur
        const colNom = selectNom.value;
        const colPrenom = selectPrenom.value;
        const colParcours = selectParcours.value;

        // Petite sécurité : on vérifie que tout a été rempli
        if (!colNom || !colPrenom || !colParcours) {
            menu_erreur.textContent = "Veuillez attribuer une colonne pour chaque champ.";
            return;
        }
        if (colNom === colPrenom || colNom === colParcours || colPrenom === colParcours) {
            menu_erreur.textContent = "Les choix des colonnes doivent être différents.";
            return;
        }

        // On crée un nouveau tableau JSON propre avec NOS clés
        const cleanEtudiants = rawData.map(ligne => {
            return {
                nom: ligne[colNom],
                prenom: ligne[colPrenom],
                parcours: ligne[colParcours]
            };
        });

        let nomFinal = fileName;
        let compteur = 1;
        // Tant qu'il existe déjà une liste avec "nomFinal" dans tab_etu, on ajoute _1, _2...
        while (tab_etu.some(liste => liste.nom_fichier === nomFinal)) {
            nomFinal = fileName + "_" + compteur;
            compteur++;
        }

        // On ajoute cette nouvelle liste à notre base de données globale
        tab_etu.push({
            nom_fichier: nomFinal,
            date_import: new Date().toLocaleDateString(),
            donnees: cleanEtudiants
        });

        // On sauvegarde dans le localStorage
        sauvegarder('tab_etu', tab_etu);

        verif_etu.textContent = cleanEtudiants.length + " étudiants importés";

        afficher_listes();
        fermerMenuMapping();
        remplir_select(); // Met à jour le sélecteur des listes étudiantes
    };

    remplir_select();
}


// --- 4. FONCTION POUR SAUVEGARDER LES SALLES ---
function sauvegarderSalles(rawData, fileName) {
    const nom_salle = fileName.replace('.xlsx', '').replace('.csv', '');

    let nomFinal = nom_salle ;
    let compteur = 1;
    // Tant qu'il existe déjà une salle avec "nomFinal" dans tab_salles, on ajoute _1, _2...
    while (tab_salles.some(liste => liste.nom_salle === nomFinal)) {
        nomFinal = nom_salle  + "_" + compteur;
        compteur++;
    }

    tab_salles.push({ // Ajoute à la table salles
        nom_salle: nomFinal, // Nom unique garanti !
        places: rawData 
    });

    sauvegarder('tab_salles', tab_salles);
    verif_salle.textContent = rawData.length + " places importées";

    remplir_select(); // met à jour le sélecteur de salles

    afficher_listes();
}


// --- FONCTION POUR FERMER LE MENU ---
function fermerMenuMapping() {
    document.querySelector('.fond_sombre').classList.add('menu_import_close');
    document.querySelector('.menu_import_etu').classList.add('menu_import_close');
    menu_erreur.textContent = "";
}