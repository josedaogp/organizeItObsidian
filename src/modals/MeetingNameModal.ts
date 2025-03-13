import { Modal, App, Notice } from 'obsidian';

export class MeetingNameModal extends Modal {
    resolve: (value: string | null) => void;

    constructor(app: App, resolve: (value: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Introduce el nombre de la reunión' });
        const inputEl = contentEl.createEl('input', { type: 'text', placeholder: 'Nombre de la reunión' });
        inputEl.focus();

        const button = contentEl.createEl('button', { text: 'Crear' });
        button.addEventListener('click', () => {
            const name = inputEl.value.trim();
            if (name) {
                this.resolve(name);
                this.close();
            } else {
                new Notice("El nombre de la reunión no puede estar vacío.");
            }
        });

        const cancelButton = contentEl.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });
    }
}
