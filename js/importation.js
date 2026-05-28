
// =================================================================================================================================================================
// GESTION DE L'IMPORTATION DE FICHIERS 
//=================================================================================================================================================================


//FONCTION POUR IMPORTER UN FICHIER EXCEL ------------------------------------------------------------------------------------------------------------------

const importFields = document.querySelectorAll(".import-field");
const allowedExtensions = /(\.xlsx|\.xls|\.csv)$/i; //Extensions autorisés

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
        
        if (!file) { //Si il n'y a pas de fichier importé
            fileNameDisplay.textContent = "Veuillez mettre un fichier Excel";
            return; 
        }

        if (!allowedExtensions.exec(file.name)) { //Si le format est invalide, on met un message d'erreur
            fileNameDisplay.textContent = "Format invalide (.xlsx, .xls, .csv, .json uniquement)"; //Message pour montrer les formats autorisés
            fileInput.value = '';
            return;
        } 

        conversionExcel(file, fileInput.id);  //On lance la fonction pour convertir le fichier en Excel

        fileInput.value = ""; 
        fileNameDisplay.textContent = text_defaut; 
    });
});




//FONCTION POUR CONVERTIR LE FICHIER EXCEL EN JSON ------------------------------------------------------------------------------------------------------------------------
//la fonction utilise la librairie Sheet.js (xlsx js) pour convertir un fichier Excel en format json
function conversionExcel(file, inputId) {
    
    const reader = new FileReader();// FileReader est un outil du navigateur pour lire les fichiers locaux

    reader.onload = (e) => { //Lorsqu'on lit le fichier
        const data = new Uint8Array(e.target.result); //Conversion du fichier en un tableau que SheetJS peut comprendre
        const workbook = XLSX.read(data, { type: 'array' }); //workbook est le fichier global
        const firstSheetName = workbook.SheetNames[0]; //Recupère le nom du premier onglet (sheet) du fichier
        const worksheet = workbook.Sheets[firstSheetName]; //sélectionne l'onglet pour lire ce qu'il contient

        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); //transforme le fichier excel en format json (defval si une case est vide)
        
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];//extrait les premières colonnes pour récupérer les titres des colonnes

        if (inputId === "import_etudiants") { // selon le bouton sur lequel on a cliqué (si c'est étudiant)
            selection_colonnes(headers, rawData, file.name); // On lance le menu de mapping pour les étudiants
        } 
        else if (inputId === "import_salles") { //(si c'est salle)
            sauvegarderSalles(rawData, file.name); //on sauvegarde directement sans menu mapping
        }
    };

    reader.readAsArrayBuffer(file); //Lance la lecture du fichier
}



const selectNom = document.getElementById('select_nom');
const selectPrenom = document.getElementById('select_prenom');
const selectSpecialite = document.getElementById('select_specialite');
const fond_sombre = document.querySelector('.fond_sombre');
const menu_import = document.querySelector('.menu_import_etu');
const menu_erreur = document.querySelector(".menu_erreur");
const verif_etu = document.querySelector("#verif_etu");
const verif_salle = document.querySelector("#verif_salle");


// FONCTION POUR GERER LE MENU MAPPING ET SAUVEGARDER LES LISTES ETUDIANTS --------------------------------------------------------------------------------------------
// Cette fonction permet de choisir quel colonnes correspond à quel noms (NOM, PRENOM, SPECIALITE) pour éviter des erreurs
function selection_colonnes(headers, rawData, fileName) {

    //Remplir les select avec les colonnes trouvées dans l'Excel
    const options_colonnes = '<option value="">-- Choisir --</option>' + 
                        headers.map(h => `<option value="${h}">${h}</option>`).join('');
    
    selectNom.innerHTML = options_colonnes;
    selectPrenom.innerHTML = options_colonnes;
    selectSpecialite.innerHTML = options_colonnes;

    // Affiche le menu
    fond_sombre.classList.remove('menu_close');
    menu_import.classList.remove('menu_close');

    // gère la validation
    window.action_valider_import = () => {
        // récupère le choix de l'utilisateur
        const colNom = selectNom.value;
        const colPrenom = selectPrenom.value;
        const colSpecialite = selectSpecialite.value;

        // vérifie que tout a été rempli
        if (!colNom || !colPrenom || !colSpecialite) {
            menu_erreur.textContent = "Veuillez attribuer une colonne pour chaque champ.";
            return;
        }
        if (colNom === colPrenom || colNom === colSpecialite || colPrenom === colSpecialite) {
            menu_erreur.textContent = "Les choix des colonnes doivent être différents.";
            return;
        }

        // crée un nouveau tableau JSON propre avec les clés
        const cleanEtudiants = rawData.map(ligne => {
            // Les trois colonnes obligatoire (nom, prenom, parcours)
            let etu = {
                nom: ligne[colNom],
                prenom: ligne[colPrenom],
                specialite: ligne[colSpecialite] || "Aucun"
            };
            // ajoute les autres colonnes comme propriétés de l'étudiant
            for (let key in ligne) {
                if (key !== colNom && key !== colPrenom && key !== colSpecialite) {
                    etu[key] = ligne[key];
                }
            }
            
            return etu;
        });

        let nom_final = generer_nom_unique(fileName, tab_etu, "nom_fichier");

        tab_etu.unshift({
            nom_fichier: nom_final,
            date_import: new Date().toLocaleDateString(),
            donnees: cleanEtudiants
        });

        sauvegarder('tab_etu', tab_etu);
        verif_etu.textContent = cleanEtudiants.length + " étudiants importés"; 
        afficher_listes();
        fermer_mapping();
        remplir_select(); 
    };

    remplir_select();
}


// FONCTION POUR SAUVEGARDER LES SALLES ----------------------------------------------------------------------------------------------------------------------------------
function sauvegarderSalles(rawData, fileName) {
    const nom_salle = fileName.replace('.xlsx', '').replace('.csv', '');

    let nom_final = nom_salle ;
    let compteur = 1;
    // Tant qu'il existe déjà une salle avec "nom_final" dans tab_salles, on ajoute _1, _2...
    while (tab_salles.some(liste => liste.nom_salle === nom_final)) {
        nom_final = nom_salle  + "_" + compteur;
        compteur++;
    }

    tab_salles.push({ // Ajoute à la table salles
        nom_salle: nom_final, // Nom unique garanti !
        places: rawData 
    });

    sauvegarder('tab_salles', tab_salles);
    verif_salle.textContent = rawData.length + " places importées";

    sauvegarder("tab_salles", tab_salles);
    afficher_listes();
    remplir_select();
}


// FONCTION POUR FERMER LE MENU MAPPING ---------------------------------------------------------------------------------------------------------------------------------------
function fermer_mapping() {
    fond_sombre.classList.add('menu_close');
    menu_import.classList.add('menu_close');
    menu_erreur.textContent = "";
}