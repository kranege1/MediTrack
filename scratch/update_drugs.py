import json

mapping = {
    "Blutdruck": ["bluthochdruck", "blutdruck", "ace-hemmer", "sartan", "betablocker", "calciumantagonist", "enapril", "lisinopril", "amlodipin", "candesartan", "exforge"],
    "Cholesterin": ["cholesterin", "statin", "ezetimib", "rosuvastatin", "atorvastatin", "sortis", "crestor"],
    "Blutverdünnung": ["blutverdünnung", "antikoagulation", "gerinnungshemmung", "plättchenhemmung", "thrombo", "xarelto", "eliquis", "pradaxa", "clopidogrel"],
    "Herz & Kreislauf": ["herzinsuffizienz", "angina pectoris", "herzstärkung", "herz", "lanitop", "dilatrend", "nitrolingual"],
    "Erkältung & Atemwege": ["schnupfen", "husten", "hals", "grippe", "erkältung", "nebenhöhlen", "rachen", "atemweg", "bronchitis", "nasivin", "mucosolvan", "wick", "aspirin complex", "silomat", "tantum", "codex", "boxagrippal", "luuf", "acc", "gelomyrtol", "otrivin"],
    "Schmerz & Fieber": ["schmerz", "fieber", "kopfschmerz", "regelschmerz", "zahnschmerz", "migräne", "mexalen", "ibumetin", "novalgin", "parkemed", "seractil", "aspirin"],
    "Bewegungsapparat": ["gelenk", "rücken", "arthrose", "rheuma", "muskel", "verspannung", "prellung", "knorpel", "bewegung", "voltaren", "deflamat", "arcoxia", "condrosulf", "mydocalm", "naprobene", "dolgit", "sirdalud", "moov"],
    "Magen & Darm": ["magen", "sodbrennen", "übelkeit", "reflux", "bauch", "verstopfung", "durchfall", "darm", "verdauung", "blähungen", "pantoloc", "iberogast", "bioflorin", "buscopan", "rennie", "imodium", "motilium", "dulcolax", "gaviscon", "creon", "ulcogant", "minifom", "omni-biotic"],
    "Diabetes": ["diabetes", "blutzucker", "insulin", "metformin", "jardiance", "ozempic"],
    "Niere & Entwässerung": ["entwässerung", "ödeme", "niere", "lasix", "hct", "aldactone", "sevelamer"],
    "Blase & Harnwege": ["blase", "harnweg", "urologie", "inkontinenz", "cystinol", "monuril", "rowatinex", "spasmo-urgenin", "uralyt-u", "urivesc", "solifenacin", "vesicare"],
    "Prostata": ["prostata", "tamsulosin", "duodart", "combodart"],
    "Psyche": ["depression", "angst", "beruhigung", "unruhe", "psyche", "psychose", "panik", "neuroleptikum", "antidepressivum", "trittico", "psychopax", "lexotanil", "cipralex", "seroquel", "temesta", "lasea", "praxiten", "laif", "mirtel", "sertralin", "venlafaxin", "xanor", "haldol"],
    "Schlaf": ["schlaf", "einschlafhilfe", "somnubene", "zoldem", "dominal"],
    "Nerven & Gehirn": ["nerven", "neuropathisch", "demenz", "neuromultivit", "pregabalin", "ebixa"],
    "Leber & Galle": ["leber", "galle", "legalon", "deursil", "hepa-merz"],
    "Infektionen": ["pilz", "bakteriell", "infekt", "canesten", "vantobra"],
    "Hormone": ["hormon", "schilddrüse", "wechsel", "pms", "femicur"],
    "Allergie": ["allergie", "heuschnupfen"],
    "Haut": ["haut", "ekzem", "wunde", "flector"],
    "Vitamine & Mineralstoffe": ["vitamin", "mineral", "mangel", "oleovit", "neuromultivit", "normolyt"]
}

def classify(entry):
    text = (entry.get("einsatzgebiet", "") + " " + entry.get("name", "")).lower()
    for klasse, keywords in mapping.items():
        for kw in keywords:
            if kw in text:
                return klasse
    return "Sonstiges"

with open('public/drugs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for kat in data.get("kategorien", []):
    for entry in kat.get("eintraege", []):
        entry["klasse"] = classify(entry)

with open('public/drugs.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Done")
