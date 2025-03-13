import { PluginSettingTab, Setting, App, TFolder } from 'obsidian';
import { CategoryNameModal } from '../modals/CategoryNameModal';
import MeetingPlugin from '../MeetingPlugin';
import { Notice } from 'obsidian';

export class MeetingSettingTab extends PluginSettingTab {
    plugin: MeetingPlugin;

    constructor(app: App, plugin: MeetingPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        // Limpiar el contenedor de configuraciones para evitar duplicaciones
        containerEl.empty();

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
