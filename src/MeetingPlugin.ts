import { Plugin, App, TFile, MarkdownView, Notice, TFolder } from 'obsidian';
import { FolderSelectModal } from './modals/FolderSelectModal';
import { NoteNameModal } from './modals/NoteNameModal';
import { MeetingNameModal } from './modals/MeetingNameModal';
import { CategoryNameModal } from './modals/CategoryNameModal';
import { MeetingSettingTab } from './settings/MeetingSettingTab';
import { checkAndCreateFolder, getSubfolders } from './utils/FolderUtils';
import { loadTemplate } from './utils/TemplateUtils';

export default class MeetingPlugin extends Plugin {
    public categories: string[] = [];
    public selectedCategory: string = "";
    public selectedFolderPath: string = "";
    public templatesFolder: string = "";

    async onload() {
        const savedSettings = await this.loadSettings();
        const savedTemplateFolder = savedSettings.templatesFolder;
        if (savedTemplateFolder) {
            this.templatesFolder = savedTemplateFolder;
        }

        this.categories = savedSettings.categories;
        this.selectedCategory = savedSettings.selectedCategory;
        this.templatesFolder = savedSettings.templatesFolder;

        this.categories.forEach((category) => {
            this.addCommand({
                id: `create-${category.toLowerCase()}`,
                name: `Crear ${category}`,
                callback: async () => this.createNoteForCategory(category),
            });
        });

        await checkAndCreateFolder(this.selectedFolderPath, this.app);
        this.addSettingTab(new MeetingSettingTab(this.app, this));
    }

    async createNoteForCategory(category: string) {
        const folderPath = `${category}`;
        const folders = await getSubfolders(folderPath, this.app);

        const selectedFolder = await this.selectFolder(folders);
        if (!selectedFolder) return;

        const fullFolderPath = selectedFolder === "Raíz" ? folderPath : `${folderPath}/${selectedFolder}`;
        const noteName = await this.promptForNoteName();
        if (!noteName) {
            new Notice("El nombre de la nota es obligatorio.");
            return;
        }

        const filePath = `${fullFolderPath}/${noteName}.md`;
        try {
            const file = await this.app.vault.create(filePath, "");
            const template = await loadTemplate(category, this.templatesFolder, this.app);
            await this.app.vault.append(file, template);
            console.log("ESTA PASANDO POR AQUI EL NUEVO");
            new Notice(`Nota '${noteName}' creada en ${fullFolderPath}`);
        } catch (error) {
            new Notice(`Error al crear la nota: ${error}`);
        }
    }

    async selectFolder(folders: string[]): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new FolderSelectModal(this.app, folders, resolve);
            modal.open();
        });
    }

    async promptForNoteName(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new NoteNameModal(this.app, resolve);
            modal.open();
        });
    }

    public updateCategoryCommands(deletedCategory?: string) {
        // El código para actualizar comandos permanece igual
    }

    public async saveSettings(): Promise<void> {
        await this.saveData({
            categories: this.categories,
            selectedCategory: this.selectedCategory,
            templatesFolder: this.templatesFolder,
        });
    }

    private loadSettings(): any {
        const savedSettings = this.loadData();
        return savedSettings || {
            categories: [],
            selectedCategory: "",
            templatesFolder: "",
        };
    }
}
