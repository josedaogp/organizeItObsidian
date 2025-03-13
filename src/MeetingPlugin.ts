import { Plugin, App, TFile, MarkdownView, Notice, TFolder } from 'obsidian';
import { FolderSelectModal } from './modals/FolderSelectModal';
import { NoteNameModal } from './modals/NoteNameModal';
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

    // Función para crear la nota con plantilla
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

        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (editor) {
            const cursorPosition = editor.getCursor();
            editor.replaceRange(`[[${noteName}]]`, cursorPosition);
        }

        const filePath = `${fullFolderPath}/${noteName}.md`;
        try {
            const file = await this.app.vault.create(filePath, "");
            const template = await loadTemplate(category, this.templatesFolder, this.app);
            await this.app.vault.append(file, template);
            new Notice(`Nota '${noteName}' creada en ${fullFolderPath}`);
        } catch (error) {
            new Notice(`Error al crear la nota: ${error}`);
        }
    }

    // Mostrar el selector de carpetas
    async selectFolder(folders: string[]): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new FolderSelectModal(this.app, folders, resolve);
            modal.open();
        });
    }

    // Función para mostrar el modal de entrada del nombre de la nota
    async promptForNoteName(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new NoteNameModal(this.app, resolve);
            modal.open();
        });
    }

    // Función para actualizar los comandos de las categorías
    public updateCategoryCommands(deletedCategory?: string) {
        console.log("Categorías antes de actualizar: ", this.categories);

        // Si se proporciona 'deletedCategory', eliminar solo el comando asociado a esa categoría
        if (deletedCategory) {
            const commandId = `create-${deletedCategory.toLowerCase()}`;
            this.removeCommand(commandId);  // Eliminar el comando de la categoría eliminada
            console.log(`Comando para ${deletedCategory} eliminado.`);
        } else {
            // Si no se proporciona 'deletedCategory', eliminamos todos los comandos
            this.categories.forEach((category) => {
                const commandId = `create-${category.toLowerCase()}`;
                this.removeCommand(commandId);  // Eliminar todos los comandos
            });
        }

        // Volver a registrar los comandos para cada categoría
        this.categories.forEach((category) => {
            this.addCommand({
                id: `create-${category.toLowerCase()}`, // ID único basado en el nombre de la categoría
                name: `Crear ${category}`,
                callback: async () => this.createNoteForCategory(category),
            });
        });

        console.log("Categorías después de actualizar: ", this.categories);
    }

    public async saveSettings(): Promise<void> {
        await this.saveData({
            categories: this.categories,
            selectedCategory: this.selectedCategory,
            templatesFolder: this.templatesFolder,
        });
    }

    private loadSettings(): any {
        // Cargar la configuración guardada
        const savedSettings = this.loadData();

        console.log("Configuración guardada:", savedSettings);
        // Si no hay configuraciones guardadas, usar las predeterminadas
        if (!savedSettings) {
            return {
                categories: [],  // Categorías predeterminadas
                selectedCategory: "",                        // Categoría seleccionada predeterminada
                templatesFolder: "",                                  // Carpeta de plantillas predeterminada
            };
        }

        return savedSettings;
    }
}
