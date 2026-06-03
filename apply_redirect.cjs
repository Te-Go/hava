const fs = require('fs');
let appTsx = fs.readFileSync('App.tsx', 'utf8');

const replacement = `    // SINAN CITY MEMORY REDIRECT STORAGE
    const prefs = getUserPreferences();
    if (prefs.consentStatus === 'accepted') {
      localStorage.setItem('sinan_last_city', toSlug(currentCity));
    }

    // Auto-Theme Logic (Only if user hasn't manually overridden via settings)
    // SINAN FIX: Ensure we only switch theme if the data matches the CURRENT city`;

if (appTsx.includes('// Auto-Theme Logic (Only if user hasn\\'t manually overridden via settings)')) {
    appTsx = appTsx.replace(/\/\/ Auto-Theme Logic \(Only if user hasn't manually overridden via settings\)\n\s*\/\/ Auto-Theme Logic \(Only if user hasn't manually overridden via settings\)\n\s*\/\/ SINAN FIX: Ensure we only switch theme if the data matches the CURRENT city/g, replacement);
    fs.writeFileSync('App.tsx', appTsx);
    console.log('App.tsx updated');
} else {
    console.log('App.tsx anchor not found');
}

let functionsPhp = fs.readFileSync('generatepress_child/functions.php', 'utf8');
if (!functionsPhp.includes('tedder_city_memory_redirect')) {
    const interceptCode = `

add_action('wp_head', 'tedder_city_memory_redirect', 5);
function tedder_city_memory_redirect() {
    // Only run this intercept on the exact root hub URL
    if ( is_page('hava-durumu') && !get_query_var('weather_city') ) {
        ?>
        <script>
            (function() {
                // 1. Check if the user has a saved city in their browser
                var lastCity = localStorage.getItem('sinan_last_city');
                
                // 2. If it exists, immediately route them to their local hub
                if (lastCity) {
                    window.location.replace('/hava-durumu/' + lastCity + '/');
                }
            })();
        </script>
        <?php
    }
}
`;
    fs.writeFileSync('generatepress_child/functions.php', functionsPhp + interceptCode);
    console.log('functions.php updated');
}
