import { CeresRoll } from "./roller.js";

const BaseActorSheet = foundry.appv1?.sheets?.ActorSheet ?? ActorSheet;
const mergeObj = foundry.utils?.mergeObject ?? mergeObject;

export class CeresActorSheet extends BaseActorSheet {
    constructor(...args) {
        super(...args);
        this.locked = true;
        this._scrollTop = 0;
    }

    static get defaultOptions() {
        return mergeObj(super.defaultOptions, {
            classes: ["ceres-sheet", "sheet", "actor"],
            template: "systems/Ceres/templates/character.hbs",
            width: 700,
            height: 700
        });
    }

    getData(options = {}) {
        const context = super.getData(options);
        context.system = this.actor.system ?? {};
        context.locked = Boolean(this.locked);

        try {
            context.globalSearchDice = game.settings.get("Ceres", "searchDice") || "k12";
        } catch (_err) {
            context.globalSearchDice = "k12";
        }

        const items = this.actor.items ? Array.from(this.actor.items) : [];
        context.ekwipunek = items
            .filter(item => item.type === "item")
            .map(item => item.toObject());

        context.zdolnosci = items
            .filter(item => item.type === "ability")
            .map(item => item.toObject());

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        const root = html instanceof HTMLElement ? $(html) : html;
        const form = root.find('form')[0] || root[0];
        if (form && this._scrollTop) {
            form.scrollTop = this._scrollTop;
        }

        if (form) {
            form.addEventListener("scroll", () => {
                this._scrollTop = form.scrollTop;
            }, { passive: true });
        }

        root.find('.toggle-lock').click(ev => {
            ev.preventDefault();
            this.locked = !this.locked;
            this.render(false);
        });

        if (!this.isEditable) return;

        root.find('.change-search-dice').change(async ev => {
            const newDice = ev.currentTarget.value;
            await game.settings.set("Ceres", "searchDice", newDice);
        });

        root.find('.reset-search-dice').click(async ev => {
            ev.preventDefault();
            await game.settings.set("Ceres", "searchDice", "k12");
            ui.notifications.info("Kość Przeszukania została zresetowana do k12.");
        });

        root.find('.roll-item').click(async ev => {
            ev.preventDefault();
            const itemId = ev.currentTarget.dataset.itemId;
            const item = this.actor.items.get(itemId);

            if (!item) return;

            const rawFormula = item.system.dice;
            const label = item.name;
            const isDurable = item.system.isDurable;

            if (rawFormula) {
                await CeresRoll(rawFormula, label, this.actor);
            }

            const dieSteps = ["k4", "k6", "k8", "k10", "k12", "k20"];
            const currentIndex = dieSteps.indexOf(rawFormula.toLowerCase());

            if (currentIndex > 0) {
                const lowerDie = dieSteps[currentIndex - 1];
                await item.update({ "system.dice": lowerDie });
            } else if (currentIndex === 0) {
                if (!isDurable) {
                    await item.delete();
                    ui.notifications.warn(`Przedmiot "${item.name}" uległ zniszczeniu i został usunięty.`);
                }
            }
        });

        root.find('.ability-roll').click(async ev => {
            ev.preventDefault();
            const itemId = ev.currentTarget.dataset.itemId;
            const item = this.actor.items.get(itemId);

            if (!item) return;

            const description = item.system.description || "Brak opisu.";
            const cost = item.system.cost ?? 0;

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `
                    <div class="ceres-chat-card">
                        <h3 style="margin: 0 0 5px 0; border-bottom: 1px solid #7a7971;">
                            <b>Zdolność:</b> ${item.name}
                            <span style="font-size: 0.8em; color: #aaa;">(Koszt: ${cost})</span>
                        </h3>
                        <div style="font-size: 0.70em; color: #cccccc; margin-bottom: 8px; line-height: 1.3;">
                            Kiedy użyjesz zdolności, obniż jeden lub wiele atrybutów o tyle stopni, ile wynosi ich koszt.
                            Pamiętaj, że nie możesz obniżyć atrybutu poniżej k4. Zdolność nie wymaga testu, po prostu się dzieje.
                        </div>
                        <div style="margin-top: 5px;">${description}</div>
                    </div>
                `
            });
        });

        root.find('.item-create').click(this._onItemCreate.bind(this));
        root.find('.ability-create').click(this._onAbilityCreate.bind(this));

        root.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item?.sheet.render(true);
        });

        root.find('.item-durable-checkbox').change(async ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            const isChecked = ev.currentTarget.checked;

            if (item) {
                await item.update({ "system.isDurable": isChecked });
            }
        });

        root.find('.item-delete').click(async ev => {
            ev.preventDefault();
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));

            if (!item) return;

            const itemName = item.name;
            const isAbility = item.type === "ability";
            const itemTypeLabel = isAbility ? "Zdolność" : "Przedmiot";

            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `
                    <div class="ceres-chat-card" style="color: #ff4d4d;">
                        <b>Usuwanie:</b> ${this.actor.name} usuwa ${itemTypeLabel.toLowerCase()} <b>${itemName}</b>.
                    </div>
                `
            });

            await item.delete();
        });

        root.find('.btn-repair-items').click(async ev => {
            ev.preventDefault();

            const durableItems = this.actor.items.filter(item => item.system.isDurable && item.system.maxDice);

            if (durableItems.length === 0) {
                ui.notifications.info("Wszystkie przedmioty trwałe (T) są już naprawione.");
                return;
            }

            const updates = durableItems.map(item => ({
                _id: item.id,
                "system.dice": item.system.maxDice
            }));

            await this.actor.updateEmbeddedDocuments("Item", updates);

            ui.notifications.info(`${this.actor.name} naprawia swoje trwałe przedmioty!`);
        });
    }

    async _onItemCreate(event) {
        event.preventDefault();

        const DialogClass = foundry.appv1?.api?.Dialog ?? Dialog;
        new DialogClass({
            title: "Dodaj przedmiot",
            content: `
                <form style="display: flex; flex-direction: column; gap: 8px; background:black; color:white;">
                  <div class="form-group" style="color:white; background:black;">
                    <label><b>Nazwa przedmiotu:</b></label>
                    <input type="text" id="item-name" placeholder="np. rewolwer, pancerz" required style="color: white;">
                  </div>
                  <div class="form-group" style="color:white; background:black;">
                    <label><b>Kość przedmiotu:</b></label>
                    <select id="item-dice" style="color: white; background:black;">
                      <option value="k4">k4</option>
                      <option value="k6">k6</option>
                      <option value="k8">k8</option>
                      <option value="k10">k10</option>
                      <option value="k12">k12</option>
                      <option value="k20">k20</option>
                    </select>
                  </div>
                  <div class="form-group" style="display: flex; align-items: center; gap: 10px; color:white; background:black;">
                    <label><b>Trwały (T):</b></label>
                    <input type="checkbox" id="item-durable">
                  </div>
                </form>
            `,
            buttons: {
                create: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Dodaj",
                    callback: async (html) => {
                        const name = html.find('#item-name').val().trim() || "Nowy Przedmiot";
                        const dice = html.find('#item-dice').val();
                        const isDurable = html.find('#item-durable').is(':checked');

                        await this.actor.createEmbeddedDocuments("Item", [{
                            name: name,
                            type: "item",
                            system: {
                                dice: dice,
                                maxDice: dice,
                                isDurable: isDurable
                            }
                        }]);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Anuluj"
                }
            },
            default: "create"
        }, {
            classes: ["dialog", "ceres-dialog"]
        }).render(true);
    }

    async _onAbilityCreate(event) {
        event.preventDefault();

        const DialogClass = foundry.appv1?.api?.Dialog ?? Dialog;
        new DialogClass({
            title: "Dodaj zdolność",
            content: `
                <form style="display: flex; flex-direction: column; gap: 8px; background:black; color:white;">
                  <div class="form-group" style="color:white; background:black;">
                    <label><b>Nazwa zdolności:</b></label>
                    <input type="text" id="ability-name" required style="color: white;">
                  </div>
                  <div class="form-group" style="color:white; background:black;">
                    <label><b>Koszt:</b></label>
                    <select id="ability-cost" style="color: white; background: #222;">
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div class="form-group" style="color:white; background:black;">
                    <label><b>Opis zdolności:</b></label>
                    <textarea id="ability-desc" rows="4" style="color: white; background: #222;"></textarea>
                  </div>
                </form>
            `,
            buttons: {
                create: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Dodaj",
                    callback: async (html) => {
                        const name = html.find('#ability-name').val().trim() || "Nowa Zdolność";
                        const cost = Number(html.find('#ability-cost').val()) || 0;
                        const description = html.find('#ability-desc').val().trim();

                        await this.actor.createEmbeddedDocuments("Item", [{
                            name: name,
                            type: "ability",
                            system: {
                                cost: cost,
                                description: description
                            }
                        }]);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Anuluj"
                }
            },
            default: "create"
        }, {
            classes: ["dialog", "ceres-dialog"]
        }).render(true);
    }
}