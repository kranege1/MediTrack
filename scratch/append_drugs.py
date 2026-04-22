import json

new_data = [
    {
        "bereich": "Schilddrüse & Hormone",
        "eintraege": [
            {"name": "Thyrex", "wirkstoff": "Levothyroxin", "hersteller": "G.L. Pharma", "standard_dosis": "50µg - 160µg", "einsatzgebiet": "Schilddrüsenunterfunktion", "klasse": "Hormone"},
            {"name": "Euthyrox", "wirkstoff": "Levothyroxin", "hersteller": "Merck", "standard_dosis": "25µg - 200µg", "einsatzgebiet": "Schilddrüsenersatztherapie", "klasse": "Hormone"},
            {"name": "Thiamazol G.L.", "wirkstoff": "Thiamazol", "hersteller": "G.L. Pharma", "standard_dosis": "5mg - 20mg", "einsatzgebiet": "Schilddrüsenüberfunktion", "klasse": "Hormone"}
        ]
    },
    {
        "bereich": "Asthma & Lunge",
        "eintraege": [
            {"name": "Foster", "wirkstoff": "Formoterol / Beclometason", "hersteller": "Chiesi", "standard_dosis": "Inhalat (100/6)", "einsatzgebiet": "Asthma/COPD", "klasse": "Erkältung & Atemwege"},
            {"name": "Seretide", "wirkstoff": "Salmeterol / Fluticason", "hersteller": "GSK", "standard_dosis": "Diskus/Inhalat", "einsatzgebiet": "Chronisches Asthma", "klasse": "Erkältung & Atemwege"},
            {"name": "Ventolin", "wirkstoff": "Salbutamol", "hersteller": "GSK", "standard_dosis": "Dosieraerosol", "einsatzgebiet": "Akute Atemnot", "klasse": "Erkältung & Atemwege"},
            {"name": "Spiriva", "wirkstoff": "Tiotropium", "hersteller": "Boehringer Ingelheim", "standard_dosis": "Respimat/Kapseln", "einsatzgebiet": "COPD", "klasse": "Erkältung & Atemwege"}
        ]
    },
    {
        "bereich": "Augen & Ohren",
        "eintraege": [
            {"name": "Hylo-Comod", "wirkstoff": "Hyaluronsäure", "hersteller": "Ursapharm", "standard_dosis": "Tropfen", "einsatzgebiet": "Trockene Augen", "klasse": "Augen & Ohren"},
            {"name": "Cosopt", "wirkstoff": "Dorzolamid / Timolol", "hersteller": "Santen", "standard_dosis": "Augentropfen", "einsatzgebiet": "Grüner Star (Glaukom)", "klasse": "Augen & Ohren"},
            {"name": "Lumigan", "wirkstoff": "Bimatoprost", "hersteller": "AbbVie", "standard_dosis": "Augentropfen", "einsatzgebiet": "Erhöhter Augendruck", "klasse": "Augen & Ohren"}
        ]
    },
    {
        "bereich": "Stoffwechsel & Vitamine",
        "eintraege": [
            {"name": "Allopurinol G.L.", "wirkstoff": "Allopurinol", "hersteller": "G.L. Pharma", "standard_dosis": "100mg - 300mg", "einsatzgebiet": "Gicht/Harnsäure", "klasse": "Diabetes & Stoffwechsel"},
            {"name": "Magnosolv", "wirkstoff": "Magnesium", "hersteller": "Viatris", "standard_dosis": "Brausepulver (Beutel)", "einsatzgebiet": "Magnesiummangel/Wadenkrämpfe", "klasse": "Vitamine & Mineralstoffe"},
            {"name": "Ferretab", "wirkstoff": "Eisen-II-fumarat", "hersteller": "G.L. Pharma", "standard_dosis": "Kapseln", "einsatzgebiet": "Eisenmangel", "klasse": "Vitamine & Mineralstoffe"},
            {"name": "Fosamax", "wirkstoff": "Alendronsäure", "hersteller": "Organon", "standard_dosis": "70mg (1x wöchentlich)", "einsatzgebiet": "Osteoporose", "klasse": "Bewegungsapparat"}
        ]
    },
    {
        "bereich": "Neurologie",
        "eintraege": [
            {"name": "Keppra", "wirkstoff": "Levetiracetam", "hersteller": "UCB", "standard_dosis": "500mg - 1000mg", "einsatzgebiet": "Epilepsie", "klasse": "Nerven & Gehirn"},
            {"name": "Madopar", "wirkstoff": "Levodopa / Benserazid", "hersteller": "Roche", "standard_dosis": "125mg - 250mg", "einsatzgebiet": "Parkinson", "klasse": "Nerven & Gehirn"},
            {"name": "Nicorette", "wirkstoff": "Nikotin", "hersteller": "Kenvue", "standard_dosis": "Kaugummi/Spray", "einsatzgebiet": "Raucherentwöhnung", "klasse": "Psyche"}
        ]
    }
]

with open('public/drugs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

data['kategorien'].extend(new_data)

with open('public/drugs.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Done")
