const { rmSync } = require('node:fs');

/**
 * Remove diretórios de forma síncrona e recursiva (utilizado para limpeza de cache).
 */
function deleteFolder(folderPath) {
    try {
        rmSync(folderPath, { recursive: true, force: true });
    } catch (error) {
        console.error(`Erro ao deletar o diretório: ${error.message}`);
    }
}

module.exports = { deleteFolder };