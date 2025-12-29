// test-pdf-parse.js
// Script de test pour diagnostiquer l'import pdf-parse

console.log('=== TEST PDF-PARSE ===\n');

try {
    // Test 1 : Import standard
    console.log('1. Import standard...');
    const pdfParse = require('pdf-parse');
    console.log('   Type:', typeof pdfParse);
    console.log('   Est une fonction?', typeof pdfParse === 'function');
    
    // Test 2 : Vérifier le module
    console.log('\n2. Contenu du module:');
    console.log('   Keys:', Object.keys(pdfParse));
    
    // Test 3 : Test avec default
    if (pdfParse.default) {
        console.log('\n3. Module a .default:');
        console.log('   Type de default:', typeof pdfParse.default);
    } else {
        console.log('\n3. Module n\'a PAS de .default');
    }
    
    console.log('\n✅ Import réussi !');
    console.log('\n📋 UTILISATION RECOMMANDÉE:');
    if (typeof pdfParse === 'function') {
        console.log('   const pdfParse = require(\'pdf-parse\');');
        console.log('   const data = await pdfParse(buffer);');
    } else if (pdfParse.default && typeof pdfParse.default === 'function') {
        console.log('   const pdfParse = require(\'pdf-parse\');');
        console.log('   const data = await pdfParse.default(buffer);');
    }
    
} catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.log('\n💡 Solution: npm install pdf-parse --save');
}

console.log('\n======================');
