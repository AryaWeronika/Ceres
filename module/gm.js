const BaseActorSheet = foundry.appv1?.sheets?.ActorSheet ?? ActorSheet;
const mergeObj = foundry.utils?.mergeObject ?? mergeObject;

export class CeresGMSheet extends BaseActorSheet {
    constructor(...args) {
        super(...args);
        this._scrollTop = 0;
    }

    static get defaultOptions() {
        return mergeObj(super.defaultOptions, {
            classes: ["ceres-sheet", "sheet", "actor", "ceres-gm-sheet"],
            template: "systems/ceres/templates/gm.hbs",
            width: 720,
            height: 850,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "opponents" }]
        });
    }

    getData() {
        const context = super.getData();
        context.system = this.actor.system;

        const rawOpponents = context.system.opponents || [];
        context.system.opponents = Array.isArray(rawOpponents) ? rawOpponents : Object.values(rawOpponents);

        const rawChallenges = context.system.challenges || [];
        context.system.challenges = Array.isArray(rawChallenges) ? rawChallenges : Object.values(rawChallenges);

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        const form = html.find('form')[0] || html[0];
        if (form && this._scrollTop) form.scrollTop = this._scrollTop;

        if (form) {
            form.addEventListener("scroll", () => {
                this._scrollTop = form.scrollTop;
            }, { passive: true });
        }

        if (!this.isEditable) return;

        html.find('.add-npc-btn').click(async ev => {
            ev.preventDefault();

            const raw = this.actor.system.opponents || [];
            const opponents = Array.isArray(raw) ? [...raw] : Object.values(raw);

            opponents.push({
                name: "Nowy Przeciwnik",
                description: "",
                hp: "",
                damage: "",
                armor: "0",
                equipment: ""
            });

            await this.actor.update({ "system.opponents": opponents });
        });

        html.find('.remove-npc-btn').click(async ev => {
            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);

            const raw = this.actor.system.opponents || [];
            const opponents = Array.isArray(raw) ? [...raw] : Object.values(raw);

            opponents.splice(index, 1);
            await this.actor.update({ "system.opponents": opponents });
        });

        html.find('.add-challenge-btn').click(async ev => {
            ev.preventDefault();

            const raw = this.actor.system.challenges || [];
            const challenges = Array.isArray(raw) ? [...raw] : Object.values(raw);

            challenges.push({
                title: "",
                difficulty: "",
                successPool: "",
                details: ""
            });

            await this.actor.update({ "system.challenges": challenges });
        });

        html.find('.remove-challenge-btn').click(async ev => {
            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);

            const raw = this.actor.system.challenges || [];
            const challenges = Array.isArray(raw) ? [...raw] : Object.values(raw);

            challenges.splice(index, 1);
            await this.actor.update({ "system.challenges": challenges });
        });
    }
}