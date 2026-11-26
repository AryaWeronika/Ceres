export async function CeresRoll(rawFormula, label, actor) {
    if (!rawFormula) return;

    const diceFormula = rawFormula.toLowerCase().replace('k', '1d');
    const roll = new Roll(diceFormula);
    await roll.evaluate();

    let titleWynik = "";
    let titleWynik2 = "";
    let kolor = "#ffffff";

    if (label === "Przeszukanie") {
        const total = roll.total;
        if (total <= 2) {
            titleWynik = "Kłopoty już tu są…";
            titleWynik2 = " ";
            kolor = "#ff4d4d";
        } else if (total <= 4) {
            titleWynik = "Kłopoty są blisko…";
            titleWynik2 = " ";
            kolor = "#ffaa00";
        } else if (total <= 6) {
            titleWynik = "Zdobywasz jeden przedmiot k6";
            titleWynik2 = " ";
            kolor = "#4dff4d";
        } else if (total <= 8) {
            titleWynik = "Zdobywasz jeden przedmiot k8";
            titleWynik2 = " ";
            kolor = "#4dff4d";
        } else if (total <= 10) {
            titleWynik = "Zdobywasz jeden przedmiot k10";
            titleWynik2 = " ";
            kolor = "#00ffff";
        } else {
            titleWynik = "Zdobywasz jeden przedmiot k12";
            titleWynik2 = " ";
            kolor = "#ffd700";
        }
    } else {
        if (roll.total <= 2) {
            titleWynik = "Porażka";
            titleWynik2 = "Następują komplikacje...";
            kolor = "#ff4d4d";

            if (label === "Pustka" && actor) {
                const diceSteps = ["k4", "k6", "k8", "k10", "k12", "k20"];
                const currentDice = actor.system.statystyki.pustka;
                const currentIndex = diceSteps.indexOf(currentDice);

                if (currentIndex !== -1 && currentIndex < diceSteps.length - 1) {
                    const nextDice = diceSteps[currentIndex + 1];
                    await actor.update({
                        "system.statystyki.pustka": nextDice
                    });
                }
            }
        } else if (roll.total === 3 || roll.total === 4) {
            titleWynik = "Częściowy sukces";
            titleWynik2 = "Udaje się, ale następują komplikacje...";
            kolor = "#ffaa00";
        } else if (roll.total >= 5) {
            titleWynik = "Sukces";
            titleWynik2 = "Im wyższy wynik, tym lepszy rezultat.";
            kolor = "#4dff4d";
        }
    }

    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: `<div class="white-text-roll">
                    <div style="text-align: center; width: 100%;">Rzut na atrybut/przedmiot:</div>
                    <div style="text-align: center; width: 100%;"><b>${label}</b></div>
                    <div style="text-align: center; width: 100%; color: ${kolor}; font-size: 17px;"><b>${titleWynik}</b></div>
                    <div style="text-align: center; width: 100%; font-size: 11px;">${titleWynik2}</div>
                 </div>`
    });
}