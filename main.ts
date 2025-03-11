import { Plugin, App, TFile ,MarkdownView, Notice, Editor, Modal, Setting, PluginSettingTab, TFolder } from 'obsidian';

export default class MeetingPlugin extends Plugin {
    // Lista de categorías definidas por el usuario en la configuración
    public categories: string[] = [];
    public selectedCategory: string = ""; // Categoría seleccionada por defecto
    public selectedFolderPath: string = ""; // Carpeta base de la categoría seleccionada
    public templatesFolder: string = "";  // La carpeta donde están las plantillas

    async onload() {
        // Cargar las configuraciones guardadas
        const savedSettings = await this.loadSettings();
        
        // Cargar la carpeta de plantillas desde la configuración
        const savedTemplateFolder = savedSettings.templatesFolder;
        if (savedTemplateFolder) {
            this.templatesFolder = savedTemplateFolder;
        }
    
        // Asignar las configuraciones cargadas
        this.categories = savedSettings.categories;
        this.selectedCategory = savedSettings.selectedCategory;
        this.templatesFolder = savedSettings.templatesFolder;
    
        // Registra los comandos para cada categoría
        this.categories.forEach((category) => {
            this.addCommand({
                id: `create-${category.toLowerCase()}`, // ID único basado en el nombre de la categoría
                name: `Crear ${category}`,
                callback: async () => this.createNoteForCategory(category),
            });
        });
    
        // Verificar si la carpeta base existe, si no, crearla automáticamente
        await this.checkAndCreateFolder(this.selectedFolderPath);
    
        // Crear una nueva página de configuración
        this.addSettingTab(new MeetingSettingTab(this.app, this));
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
            const modal = new NoteNameModal(this.app, resolve); // Usamos el modal de nombre de nota
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



    // Función para crear la nota con plantilla
    async createNoteForCategory(category: string) {
        const folderPath = `${category}`;
        const folders = await this.getSubfolders(folderPath);

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
            const file = await this.app.vault.create(filePath ,"");  // Agregar el nombre como H1
        
            // Cargar la plantilla y agregarla sin el H1
            const template = await this.loadTemplate(category);  
            console.log("Plantilla:",template);
            await this.app.vault.append(file, template);  // Añadir el contenido de la plantilla sin el H1 de la plantilla

            new Notice(`Nota '${noteName}' creada en ${fullFolderPath}`);
        } catch (error) {
            new Notice(`Error al crear la nota: ${error}`);
        }
    }


    // Función para cargar la plantilla y eliminar el encabezado H1 de la plantilla si existe
    private async loadTemplate(category: string): Promise<string> {
        const templateName = `${category}.md`;  // El nombre de la plantilla podría ser el mismo que la categoría
        const templatePath = `${this.templatesFolder}/${templateName}`;

        try {
            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            if (templateFile instanceof TFile) {
                const templateContent = await this.app.vault.read(templateFile);

                // Eliminar el encabezado H1 si está presente en la plantilla
                // Esto reemplaza solo el primer H1 que aparece en la plantilla
                const templateWithoutH1 = templateContent.replace(/^# .*\n/, ''); 
                
                // console.log("Plantilla:",templateWithoutH1)
                return templateWithoutH1;  // Retorna la plantilla sin el encabezado H1
            } else {
                new Notice("No se encontró la plantilla para esta categoría.");
                return "";  // Si no se encuentra la plantilla, retornar una cadena vacía
            }
        } catch (error) {
            new Notice(`Error al cargar la plantilla: ${error}`);
            return "";
        }
    }



    // Obtener las subcarpetas de la carpeta base de la categoría seleccionada
    async getSubfolders(folderPath: string): Promise<string[]> {
        const folder = this.app.vault.getAbstractFileByPath(folderPath);

        if (folder && folder instanceof TFolder) {
            const subfolders: string[] = [];
            this.app.vault.getAllFolders().forEach(file => {
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

    // Guardar las configuraciones
    public async saveSettings(): Promise<void> {
        await this.saveData({
            categories: this.categories,             // Guardar las categorías
            selectedCategory: this.selectedCategory,  // Guardar la categoría seleccionada
            templatesFolder: this.templatesFolder,    // Guardar la carpeta de plantillas
        });
    }


    // Cargar las configuraciones
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




    // Verificar si la carpeta existe, y si no, la crea
    async checkAndCreateFolder(folderPath: string) {
        const folder = this.app.vault.getAbstractFileByPath(folderPath);

        if (!folder) {
            try {
                await this.app.vault.createFolder(folderPath);
                new Notice(`La carpeta '${folderPath}' ha sido creada.`);
            } catch (error) {
                new Notice(`Error al crear la carpeta: ${error}`);
            }
        }
    }
}



// Modal para ingresar el nombre de la reunión
class MeetingNameModal extends Modal {
    resolve: (value: string | null) => void;

    constructor(app: App, resolve: (value: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;

        // Título del modal
        contentEl.createEl('h2', { text: 'Introduce el nombre de la reunión' });

        // Crear campo de texto para el nombre de la reunión
        const inputEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Nombre de la reunión',
        });
        inputEl.focus();

        // Agregar un botón para confirmar el nombre
        const button = contentEl.createEl('button', { text: 'Crear' });
        button.addEventListener('click', () => {
            const name = inputEl.value.trim();
            if (name) {
                this.resolve(name);  // Resuelve la promesa con el nombre ingresado
                this.close();
            } else {
                new Notice("El nombre de la reunión no puede estar vacío.");
            }
        });

        // Agregar botón de cancelar
        const cancelButton = contentEl.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });
    }
}

// Modal para seleccionar una carpeta
class FolderSelectModal extends Modal {
    folders: string[];
    resolve: (value: string | null) => void;
    selectedIndex: number = 0;

    constructor(app: App, folders: string[], resolve: (value: string | null) => void) {
        super(app);
        this.folders = folders;
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Selecciona una carpeta' });

        // Crear un contenedor para la lista de carpetas
        const listEl = contentEl.createEl('ul');
        
        // Mostrar las carpetas con su ruta relativa
        this.folders.forEach((folder, index) => {
            const itemEl = listEl.createEl('li');
            itemEl.textContent = folder;  // Mostramos la carpeta con la ruta relativa
            itemEl.setAttr("tabindex", "0");  // Permitir selección por teclado

            // Agregar la clase "selected" al elemento seleccionado
            if (index === this.selectedIndex) {
                itemEl.addClass("selected");
            }

            // Manejar selección con clic
            itemEl.addEventListener('click', () => {
                this.resolve(folder);
                this.close();
            });

            // Manejar selección con teclado (flechas y Enter)
            itemEl.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.key === 'Enter') {
                    this.resolve(folder);
                    this.close();
                } else if (event.key === 'ArrowDown') {
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.folders.length - 1);
                    this.updateSelection(listEl);
                } else if (event.key === 'ArrowUp') {
                    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                    this.updateSelection(listEl);
                }
            });
        });

        // Agregar campo de búsqueda para seleccionar por teclado
        const searchInput = contentEl.createEl('input', { type: 'text', placeholder: 'Buscar carpeta...' });
        searchInput.addEventListener('input', () => {
            const filter = searchInput.value.toLowerCase();
            const items = listEl.querySelectorAll('li');
            items.forEach(item => {
                item.style.display = item.textContent!.toLowerCase().includes(filter) ? '' : 'none';
            });
        });

        // Establecer foco en el primer elemento de la lista
        const firstItem = listEl.querySelectorAll('li')[this.selectedIndex];
        if (firstItem) {
            firstItem.focus();
        }
    }

    // Método para actualizar la selección por teclado
    updateSelection(listEl: HTMLUListElement) {
        const items = listEl.querySelectorAll('li');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.addClass('selected'); // Resaltar el elemento seleccionado
                item.focus();  // Asegurarse de que el elemento tenga el foco
            } else {
                item.removeClass('selected'); // Eliminar resaltado de los demás
            }
        });
    }
}


// Interfaz de configuración
class MeetingSettingTab extends PluginSettingTab {
    plugin: MeetingPlugin;

    constructor(app: App, plugin: MeetingPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    

    display(): void {
        const { containerEl } = this;

        // Limpiar el contenedor de configuraciones para evitar duplicaciones
        containerEl.empty();  // Esto eliminará todos los elementos previos del contenedor

        // Título de la configuración
        containerEl.createEl('h2', { text: 'Configuración de categorías' });

        // Mostrar categorías en un contenedor
        const categoriesContainer = containerEl.createEl('div');
        categoriesContainer.createEl('h3', { text: 'Categorías' });

        // Mostrar las categorías definidas en el plugin
        this.plugin.categories.forEach((category, index) => {
            new Setting(categoriesContainer)
                .setName(category)
                .addButton((button) =>
                    button.setButtonText('Eliminar').onClick(() => {
                        // Eliminar categoría
                        this.plugin.categories.splice(index, 1);
                        this.plugin.saveSettings();
                        this.plugin.updateCategoryCommands(category);
                        this.display();  // Redibujar la configuración
                    })
                );
        });

        // Función para agregar categoría con un modal
        new Setting(containerEl)
        .addButton((button) =>
            button.setButtonText('Agregar Categoría').onClick(() => {
                // Crear el modal para ingresar el nombre de la categoría
                const modal = new CategoryNameModal(this.plugin.app, (categoryName: string | null) => {
                    if (categoryName && !this.plugin.categories.includes(categoryName)) {
                        this.plugin.categories.push(categoryName);  // Agregar nueva categoría
                        this.plugin.saveSettings();  // Guardar las categorías
                        this.plugin.updateCategoryCommands();  // Actualizar los comandos
                        this.display();  // Redibujar la configuración
                    } else if (categoryName) {
                        new Notice("La categoría ya existe.");
                    }
                });
                modal.open();  // Mostrar el modal
            })
        );

        // Título de la configuración de plantillas
        containerEl.createEl('h2', { text: 'Configuración de Plantillas' });

        // Selector de carpeta para plantillas
        new Setting(containerEl)
            .setName('Carpeta de Plantillas')
            .setDesc('Selecciona la carpeta que contiene las plantillas para las notas')
            .addText(text => text
                .setPlaceholder('Introduce la ruta de la carpeta de plantillas')
                .setValue(this.plugin.templatesFolder)  // Mostrar la carpeta de plantillas seleccionada
                .onChange(async (value) => {
                    // Verifica si la carpeta existe
                    const folder = this.plugin.app.vault.getAbstractFileByPath(value);
                    if (folder instanceof TFolder) {
                        this.plugin.templatesFolder = value;
                        this.plugin.saveSettings();
                    } else {
                        new Notice("La carpeta especificada no existe.");
                    }
                })
            );
    }
}




class NoteNameModal extends Modal {
    resolve: (value: string | null) => void;

    constructor(app: App, resolve: (value: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Introduce el nombre de la nota' });

        const inputEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Nombre de la nota',
        });
        inputEl.focus();

        const button = contentEl.createEl('button', { text: 'Crear' });
        button.addEventListener('click', () => {
            const name = inputEl.value.trim();
            if (name) {
                this.resolve(name);  // Resuelve la promesa con el nombre ingresado
                this.close();
            } else {
                new Notice("El nombre de la nota no puede estar vacío.");
            }
        });

        const cancelButton = contentEl.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });
    }
}

// Modal para ingresar el nombre de la nueva categoría
class CategoryNameModal extends Modal {
    resolve: (value: string | null) => void;

    constructor(app: App, resolve: (value: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Introduce el nombre de la nueva categoría' });

        // Crear campo de texto para el nombre de la categoría
        const inputEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Nombre de la categoría',
        });
        inputEl.focus();

        // Agregar un botón para confirmar el nombre
        const button = contentEl.createEl('button', { text: 'Agregar' });
        button.addEventListener('click', () => {
            const name = inputEl.value.trim();
            if (name) {
                this.resolve(name);  // Resuelve la promesa con el nombre ingresado
                this.close();
            } else {
                new Notice("El nombre de la categoría no puede estar vacío.");
            }
        });

        // Agregar botón de cancelar
        const cancelButton = contentEl.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });
    }
}
