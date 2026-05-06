
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


//FONCTION POUR GARDER LES INPUT COCHES ----------------------------------------------------------------------------------
function EnregChoix() {
    const formElements = document.querySelectorAll('input[type="checkbox"], input[type="time"], .selects_table select');
    
    formElements.forEach(element => {
        if (!element.id) return;
        
        const storageKey = 'form_sauvegarde_' + element.id;
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

