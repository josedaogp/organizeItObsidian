import { Modal, App, Notice } from 'obsidian';

export class NoteNameModal extends Modal {
    resolve: (value: string | null) => void;

    constructor(app: App, resolve: (value: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Introduce el nombre de la nota' });

        // Crear campo de texto para el nombre de la nota
        const inputEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Nombre de la nota',
        });
        inputEl.focus();

        // Crear botón para confirmar el nombre
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

        // Agregar botón de cancelar
        const cancelButton = contentEl.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });
    }
}
