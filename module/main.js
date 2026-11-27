import { CeresRoll } from "./roller.js";
import { CeresActorSheet } from "./character.js";
import { CeresGMSheet } from "./gm.js";
import {
    CharacterDataModel,
    NarratorDataModel,
    ItemDataModel,
    AbilityDataModel
} from "./data-models.js";

const DIE_STEPS = ["k4", "k6", "k8", "k10", "k12", "k20"];

Hooks.once("init", () => {
    console.log("Ceres | Inicjalizacja systemu");

    game.settings.register("Ceres", "searchDice", {
        name: "Kość Przeszukania",
        scope: "world",
        config: false,
        type: String,
        default: "k12",
        onChange: () => {
            Object.values(ui.windows).forEach(app => {
                if (app instanceof CeresActorSheet) app.render();
            });
        }
    });

    CONFIG.Actor.dataModels = {
        character: CharacterDataModel,
        narrator: NarratorDataModel
    };

    CONFIG.Item.dataModels = {
        item: ItemDataModel,
        ability: AbilityDataModel
    };

    CONFIG.Combat.initiative = {
        formula: "1d6",
        decimals: 2
    };

    const ActorsCollection = foundry.documents?.collections?.Actors ?? Actors;
    const BaseActorSheet = foundry.appv1?.sheets?.ActorSheet;

    if (BaseActorSheet) {
        try {
            ActorsCollection.unregisterSheet("core", BaseActorSheet);
        } catch (_err) {
        }
    }

    ActorsCollection.registerSheet("Ceres", CeresActorSheet, {
        types: ["character"],
        makeDefault: true,
        label: "Karta Postaci Ceres"
    });

    ActorsCollection.registerSheet("Ceres", CeresGMSheet, {
        types: ["narrator"],
        makeDefault: true,
        label: "Karta Narratora Ceres"
    });
});

Hooks.on("renderActorSheet", (app, html) => {
    const root = html instanceof HTMLElement ? $(html) : html;


    root.find('.rollable').click(async (event) => {
        event.preventDefault();
        const labelElement = $(event.currentTarget);
        const label = labelElement.data('label');
        const actor = app.actor;

        if (label === "Przeszukanie") {
            const currentDice = game.settings.get("Ceres", "searchDice");
            await CeresRoll(currentDice, label, actor);

            const currentIndex = DIE_STEPS.indexOf(currentDice.toLowerCase());
            if (currentIndex > 0) {
                const lowerDie = DIE_STEPS[currentIndex - 1];
                await game.settings.set("Ceres", "searchDice", lowerDie);
            } else {
                ui.notifications.warn("Kość Przeszukania osiągnęła już najniższy poziom (k4)!");
            }
            return;
        }

        let selectElement = labelElement.closest('.attribute-row').find('select[name$=".val"]');
        if (!selectElement.length) {
            selectElement = labelElement.nextAll('select').first();
        }

        const rawFormula = selectElement.val();
        const propertyPath = selectElement.attr('name');

        if (!rawFormula) return;

        await CeresRoll(rawFormula, label, actor);

        if (propertyPath !== "system.statystyki.pustka") {
            const currentIndex = DIE_STEPS.indexOf(rawFormula.toLowerCase());
            if (currentIndex > 0) {
                const lowerDie = DIE_STEPS[currentIndex - 1];
                await actor.update({
                    [propertyPath]: lowerDie
                });
            }
        }
    });

    
    root.find('.btn-rest').click(async (event) => {
        event.preventDefault();
        const actor = app.actor;
        const atrybuty = actor.system.atrybuty;

        if (!atrybuty) return;

        const updateData = {};
        for (const [key, attr] of Object.entries(atrybuty)) {
            if (attr.max) {
                updateData[`system.atrybuty.${key}.val`] = attr.max;
            }
        }

        await actor.update(updateData);
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `
            <div class="ceres-chat-card">
                <h3 style="margin: 0 0 5px 0; border-bottom: 1px solid #7a7971;color:white;"><b>Złap oddech</b></h3>
                <div>Postać <b>${actor.name}</b> łapie oddech! Wszystkie atrybuty zostały odnowione do wartości maksymalnych.</div>
            </div>
        `
        });
    });


    // --- Naprawa statku ---
    root.find('.btn-ship-rest').click(async (event) => {
        event.preventDefault();
        const actor = app.actor;
        const systemy = actor.system?.statek?.systemy;

        if (!systemy) return;

        const updateData = {};
        for (const [key, sys] of Object.entries(systemy)) {
            if (sys.max) {
                updateData[`system.statek.systemy.${key}.val`] = sys.max;
            }
        }

        await actor.update(updateData);

        const shipName = actor.system.statek.nazwa ? ` <b>${actor.system.statek.nazwa}</b>` : '';
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `
                <div class="ceres-chat-card">
                    <h3 style="margin: 0 0 5px 0; border-bottom: 1px solid #7a7971;color:white;"><b>Naprawa Statku</b></h3>
                    <div>Systemy statku${shipName} zostały odnowione do wartości maksymalnych!</div>
                </div>
            `
        });
    });

    // --- Naprawa przedmiotów (T) ---
    root.find('.btn-repair-items').click(async (event) => {
        event.preventDefault();
        const actor = app.actor;

        const durableItems = actor.items.filter(i => i.system?.isDurable);

        if (durableItems.length === 0) {
            return;
        }

        const updates = durableItems.map(item => ({
            _id: item._id,
            "system.dice": item.system.maxDice || item.system.dice
        }));

        await actor.updateEmbeddedDocuments("Item", updates);

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `
                <div class="ceres-chat-card">
                    <h3 style="margin: 0 0 5px 0; border-bottom: 1px solid #7a7971;color:white;"><b>Naprawa Ekwipunku</b></h3>
                    <div>Postać <b>${actor.name}</b> naprawia swoje trwałe przedmioty (T)!</div>
                </div>
            `
        });
    });
});