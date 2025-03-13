import { Modal, App, Notice } from 'obsidian';

export class CategoryNameModal extends Modal {
    resolve: (value: string | null) => void;

    constructor(app: App, resolve: (value: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Introduce el nombre de la nueva categoría' });
        const inputEl = contentEl.createEl('input', { type: 'text', placeholder: 'Nombre de la categoría' });
        inputEl.focus();

        const button = contentEl.createEl('button', { text: 'Agregar' });
        button.addEventListener('click', () => {
            const name = inputEl.value.trim();
            if (name) {
                this.resolve(name);
                this.close();
            } else {
                new Notice("El nombre de la categoría no puede estar vacío.");
            }
        });

        const cancelButton = contentEl.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });
    }
}
