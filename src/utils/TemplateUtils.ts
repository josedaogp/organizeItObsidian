import { App, TFile, Notice } from 'obsidian';

export async function loadTemplate(category: string, templatesFolder: string, app: App): Promise<string> {
    const templateName = `${category}.md`;
    const templatePath = `${templatesFolder}/${templateName}`;
    
    try {
        const templateFile = app.vault.getAbstractFileByPath(templatePath);
        if (templateFile instanceof TFile) {
            const templateContent = await app.vault.read(templateFile);
            const templateWithoutH1 = templateContent.replace(/^# .*\n/, '');
            return templateWithoutH1;
        } else {
            new Notice("No se encontró la plantilla para esta categoría.");
            return "";
        }
    } catch (error) {
        new Notice(`Error al cargar la plantilla: ${error}`);
        return "";
    }
}
