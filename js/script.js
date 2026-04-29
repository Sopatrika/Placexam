
//FONCTION POUR OUVRIR LE MENU DEROULANT A GAUCHE ------------------------------------------------------------------------------------------------------------------

const menu_listes = document.querySelector(".menu_listes");
const button_menu_gauche = document.querySelector(".button_menu_gauche");

button_menu_gauche.addEventListener("click", () => {
    menu_listes.classList.toggle("menu_open");
})




//FONCTION POUR OUVRIR/FERMER LES LISTES DANS LE MENU DEROULANT ------------------------------------------------------------------------------------------------------------

const btn_sec_menu = document.querySelectorAll(".btn-section-menu");
const menu_sec = document.querySelectorAll(".menu_deroulant_gauche > section");

btn_sec_menu.forEach(btn => {
    btn.addEventListener("click", () => {
        // On enlève la classe active de tous les boutons et on la met sur celui cliqué
        btn_sec_menu.forEach(e => e.classList.remove("btn_open"));
        btn.classList.add("btn_open");

        const nomOnglet = btn.textContent.trim(); //recupère le nom du menu qu'on a cliqué en supprimant les espaces avec trim();

        // Les menus Matières et Historique des placements sont spécials (ils montrent directement les matières/placements en sous menu pas des listes d'éléments)
        if (nomOnglet === "Matières" || nomOnglet === "Historique des placements") {
            ouvrir_details_liste(nomOnglet); // Appelle la super-fonction
            return; // On arrête là !
        }

        // Comportement classique pour Etudiants et Salles
        menu_sec.forEach(sec => {
            if (sec.classList.contains(btn.dataset.sec)) sec.classList.add("sec_open");
            else sec.classList.remove("sec_open");
        });
    });
});




//FONCTION POUR CREER LES BLOCS DANS LE MENU --------------------------------------------------------------------------------------------------------------------------------

function bloc_listes(liste) {
    let bloc_el = document.createElement("li");
    bloc_el.dataset.name = liste;

    bloc_el.innerHTML = `
        <div class="nom_element">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5613 10.7815C20.8422 11.0628 21 11.444 21 11.8415C21 12.239 20.8422 12.6203 20.5613 12.9015L14.9053 18.5605C14.6239 18.8419 14.2423 19 13.8443 19C13.4464 19 13.0647 18.8419 12.7833 18.5605C12.5019 18.2791 12.3438 17.8975 12.3438 17.4995C12.3438 17.1016 12.5019 16.7199 12.7833 16.4385L15.8793 13.3415H4.34432C3.9465 13.3415 3.56497 13.1835 3.28366 12.9022C3.00236 12.6209 2.84432 12.2393 2.84432 11.8415C2.84432 11.4437 3.00236 11.0622 3.28366 10.7809C3.56497 10.4996 3.9465 10.3415 4.34432 10.3415H15.8793L12.7833 7.24552C12.644 7.10619 12.5335 6.94078 12.4581 6.75873C12.3827 6.57668 12.3438 6.38157 12.3438 6.18452C12.3438 5.98747 12.3827 5.79236 12.4581 5.61031C12.5335 5.42826 12.644 5.26285 12.7833 5.12352C12.9227 4.98419 13.0881 4.87366 13.2701 4.79826C13.4522 4.72285 13.6473 4.68404 13.8443 4.68404C14.0414 4.68404 14.2365 4.72285 14.4185 4.79826C14.6006 4.87366 14.766 4.98419 14.9053 5.12352L20.5613 10.7815Z" fill="#FBFDFF"/>
            </svg>
            <span class="nom_texte"></span>
        </div>
        <div class="ul_icons">
            <svg class="trash_element" width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;">
                <path d="M5.33333 9.33333H26.6667M13.3333 14.6667V22.6667M18.6667 14.6667V22.6667M6.66666 9.33333L7.99999 25.3333C7.99999 26.0406 8.28095 26.7189 8.78104 27.219C9.28114 27.719 9.95942 28 10.6667 28H21.3333C22.0406 28 22.7188 27.719 23.2189 27.219C23.719 26.7189 24 26.0406 24 25.3333L25.3333 9.33333M12 9.33333V5.33333C12 4.97971 12.1405 4.64057 12.3905 4.39052C12.6406 4.14048 12.9797 4 13.3333 4H18.6667C19.0203 4 19.3594 4.14048 19.6095 4.39052C19.8595 4.64057 20 4.97971 20 5.33333V9.33333" stroke="#FBFDFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg class="rename_element" width="28" height="28" viewBox="0 0 50 41" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;">
                <path d="M31.25 24.3333L22.9167 32.6667H43.75V24.3333H31.25ZM25.125 5.97915L6.25 24.8541V32.6667H14.0625L32.9375 13.7916L25.125 5.97915ZM38.9792 7.74998C39.7917 6.93748 39.7917 5.58332 38.9792 4.81248L34.1042 -0.0625169C33.7138 -0.45054 33.1858 -0.668335 32.6354 -0.668335C32.085 -0.668335 31.557 -0.45054 31.1667 -0.0625169L27.3542 3.74998L35.1667 11.5625L38.9792 7.74998Z" fill="#FBFDFF"/>
            </svg>
        </div>
    `;

    bloc_el.querySelector('.nom_texte').textContent = liste;
    return bloc_el;
}





// FONCTION POUR AFFICHER LES LISTES DANS LE MENUS ------------------------------------------------------------------------------------------------------------------
function afficher_listes() {
    // 1. On cible les deux conteneurs UL spécifiques
    const liste_etu = document.querySelector(".etu_sec .menu_ul");
    const liste_salles = document.querySelector(".salle_sec .menu_ul");

    // 2. On vide complètement l'affichage actuel (très important pour ne pas dupliquer)
    if (liste_etu) liste_etu.innerHTML = "";
    if (liste_salles) liste_salles.innerHTML = "";

    // 3. On injecte les étudiants
    tab_etu.forEach(liste => {
        const nom = liste.nom_fichier || "Liste sans nom";
        const li = bloc_listes(nom);
        if (liste_etu) liste_etu.appendChild(li);
    });

    // 4. On injecte les salles
    tab_salles.forEach(liste => {
        const nom = liste.nom_salle || "Salle sans nom";
        const li = bloc_listes(nom);
        if (liste_salles) liste_salles.appendChild(li);
    });
}

// Appel initial au chargement de la page pour afficher ce qui est dans le LocalStorage
document.addEventListener("DOMContentLoaded", () => {
    afficher_listes();
});





//FONCTION POUR GARDER LES INPUT COCHES ----------------------------------------------------------------------------------------------------------------------------------------

function EnregChoix() {
    const formElements = document.querySelectorAll('input:not([type="file"]), select');

    formElements.forEach(element => {
        if (!element.id) return;

        const storageKey = 'form_sauvegarde_' + element.id;
        const savedValue = localStorage.getItem(storageKey);

        // Restaurer
        if (savedValue !== null) {
            if (element.type === 'checkbox') {
                element.checked = (savedValue === 'true');
            } else {
                element.value = savedValue; 
            }
        }

        // Sauvegarde
        element.onchange = () => { //Si il y'a un changement dans les input
            const val = (element.type === 'checkbox') ? element.checked : element.value;
            localStorage.setItem(storageKey, val);

            // Si on change de liste, on doit rafraîchir les filtres et le tableau
            if (element.id === "liste_etus") {
                generer_filtres();
            }
        };
    });
}

