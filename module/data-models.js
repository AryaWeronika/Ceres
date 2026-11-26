const {
    StringField,
    NumberField,
    BooleanField,
    SchemaField,
    ArrayField,
    ObjectField
} = foundry.data.fields;

function diceField(defaultVal = "k6") {
    return new SchemaField({
        max: new StringField({ initial: defaultVal }),
        val: new StringField({ initial: defaultVal })
    });
}

export class CharacterDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            dane: new SchemaField({
                imie: new StringField({ initial: "" }),
                ksywa: new StringField({ initial: "" }),
                nazwisko: new StringField({ initial: "" }),
                przeszlosc: new StringField({ initial: "" }),
                slabosc: new StringField({ initial: "" }),
                wyglad: new StringField({ initial: "" })
            }),
            atrybuty: new SchemaField({
                krzepa: diceField("k6"),
                zrecznosc: diceField("k6"),
                spryt: diceField("k6"),
                intelekt: diceField("k6"),
                osobowosc: diceField("k6")
            }),
            statystyki: new SchemaField({
                przeszukanie: new StringField({ initial: "k12" }),
                pustka: new StringField({ initial: "k4" }),
                pd: new NumberField({ initial: 0, integer: true }),
                zdrowie: new SchemaField({
                    z1: new BooleanField({ initial: true }),
                    z2: new BooleanField({ initial: true }),
                    z3: new BooleanField({ initial: true }),
                    z4: new BooleanField({ initial: true }),
                    z5: new BooleanField({ initial: false }),
                    z6: new BooleanField({ initial: false })
                }),
                pancerz: new SchemaField({
                    p1: new BooleanField({ initial: false }),
                    p2: new BooleanField({ initial: false }),
                    p3: new BooleanField({ initial: false }),
                    p4: new BooleanField({ initial: false })
                })
            }),
            ekwipunek: new StringField({ initial: "" }),
            drobiazgi: new StringField({ initial: "" }),
            statek: new SchemaField({
                nazwa: new StringField({ initial: "" }),
                rodzaj: new StringField({ initial: "" }),
                miejsca: new StringField({ initial: "" }),
                kadlub: new SchemaField({
                    value: new NumberField({ initial: 10, integer: true }),
                    max: new NumberField({ initial: 10, integer: true })
                }),
                ability: new SchemaField({
                    description: new StringField({ initial: "" }),
                    cost: new NumberField({ initial: 0, integer: true })
                }),
                wyglad: new StringField({ initial: "" }),
                cargo: new StringField({ initial: "" }),
                systemy: new SchemaField({
                    uzbrojenie: diceField("k6"),
                    naped: diceField("k6"),
                    skanery: diceField("k6")
                })
            })
        };
    }
}

export class NarratorDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            campaign: new StringField({ initial: "" }),
            opponents: new ArrayField(new ObjectField()),
            challenges: new ArrayField(new ObjectField()),
            gmNotes: new StringField({ initial: "" })
        };
    }
}

export class ItemDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            dice: new StringField({ initial: "k6" }),
            maxDice: new StringField({ initial: "k6" }),
            isDurable: new BooleanField({ initial: true })
        };
    }
}

export class AbilityDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            cost: new NumberField({ initial: 0, integer: true }),
            description: new StringField({ initial: "" })
        };
    }
}