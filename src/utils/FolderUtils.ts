import { App, TFolder, TFile, Notice } from 'obsidian';

export async function getSubfolders(folderPath: string, app: App): Promise<string[]> {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (folder && folder instanceof TFolder) {
        const subfolders: string[] = [];
        app.vault.getAllFolders().forEach(file => {
            if (file instanceof TFolder && file.path.startsWith(folderPath)) {
                const relativePath = file.path.slice(folderPath.length + 1);
                const parts = relativePath.split('/');
                if (parts.length === 1 && !subfolders.includes(parts[0])) {
                    subfolders.push(parts[0]);
                }
            }
        });
        subfolders.unshift('Raíz');
        return subfolders;
    }
    return [];
}

export async function checkAndCreateFolder(folderPath: string, app: App) {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
        try {
            await app.vault.createFolder(folderPath);
            new Notice(`La carpeta '${folderPath}' ha sido creada.`);
        } catch (error) {
            new Notice(`Error al crear la carpeta: ${error}`);
        }
    }
}
