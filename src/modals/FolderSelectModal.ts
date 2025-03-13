import { Modal, App } from 'obsidian';

export class FolderSelectModal extends Modal {
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

        const listEl = contentEl.createEl('ul');
        this.folders.forEach((folder, index) => {
            const itemEl = listEl.createEl('li');
            itemEl.textContent = folder;
            itemEl.setAttr("tabindex", "0");

            itemEl.addEventListener('click', () => {
                this.resolve(folder);
                this.close();
            });

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

        const searchInput = contentEl.createEl('input', { type: 'text', placeholder: 'Buscar carpeta...' });
        searchInput.addEventListener('input', () => {
            const filter = searchInput.value.toLowerCase();
            const items = listEl.querySelectorAll('li');
            items.forEach(item => {
                item.style.display = item.textContent!.toLowerCase().includes(filter) ? '' : 'none';
            });
        });

        const firstItem = listEl.querySelectorAll('li')[this.selectedIndex];
        if (firstItem) {
            firstItem.focus();
        }
    }

    updateSelection(listEl: HTMLUListElement) {
        const items = listEl.querySelectorAll('li');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.addClass('selected');
                item.focus();
            } else {
                item.removeClass('selected');
            }
        });
    }
}
