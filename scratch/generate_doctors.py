import json
import random

specialties = [
    'Allgemeinmediziner', 'Internist', 'Kardiologe', 'Zahnarzt', 'Urologe', 
    'Gynäkologe', 'Orthopäde', 'Hautarzt', 'Augenarzt', 'HNO-Arzt', 
    'Kinderarzt', 'Neurologe', 'Psychiater', 'Radiologe', 'Chirurg'
]

locations = [
    {"ort": "Innsbruck", "plz": "6020", "strassen": ["Maria-Theresien-Straße", "Anichstraße", "Innrain", "Museumstraße", "Bürgerstraße"]},
    {"ort": "Hall in Tirol", "plz": "6060", "strassen": ["Stadtgraben", "Wallpachgasse", "Eugenstraße"]},
    {"ort": "Schwaz", "plz": "6130", "strassen": ["Swarovskistraße", "Innsbrucker Straße", "Wopfnerstraße"]},
    {"ort": "Wörgl", "plz": "6300", "strassen": ["Bahnhofstraße", "Innsbrucker Straße", "Salzburger Straße"]},
    {"ort": "Kufstein", "plz": "6330", "strassen": ["Oberer Stadtplatz", "Kinkstraße", "Salurner Straße"]},
    {"ort": "Telfs", "plz": "6410", "strassen": ["Untermarktstraße", "Obermarktstraße", "Kirchstraße"]},
    {"ort": "Imst", "plz": "6460", "strassen": ["Rathausplatz", "Pfarrgasse", "Schustergasse"]},
    {"ort": "Landeck", "plz": "6500", "strassen": ["Malserstraße", "Innstraße", "Bruggfeldstraße"]},
    {"ort": "Reutte", "plz": "6600", "strassen": ["Obermarkt", "Untermarkt", "Mühler Straße"]},
    {"ort": "Kitzbühel", "plz": "6370", "strassen": ["Vorderstadt", "Hinterstadt", "Bichlstraße"]},
    {"ort": "Lienz", "plz": "9900", "strassen": ["Messinggasse", "Muchargasse", "Rosengasse"]},
    {"ort": "St. Johann in Tirol", "plz": "6380", "strassen": ["Salzburger Straße", "Poststraße", "Speckbacherstraße"]},
    {"ort": "Jenbach", "plz": "6200", "strassen": ["Postgasse", "Achenseestraße", "Huberstraße"]},
    {"ort": "Mayrhofen", "plz": "6290", "strassen": ["Hauptstraße", "Scheulingstraße", "Dursterstraße"]},
    {"ort": "Wattens", "plz": "6112", "strassen": ["Swarovskistraße", "Kirchplatz", "Ludwig-Lassl-Straße"]}
]

vornamen_m = ["Thomas", "Andreas", "Stefan", "Markus", "Christian", "Michael", "Peter", "Wolfgang", "Hans", "Josef", "Klaus", "Jürgen", "Robert", "Alexander", "Martin"]
vornamen_w = ["Maria", "Elena", "Lisa", "Petra", "Julia", "Sophie", "Karin", "Helga", "Claudia", "Monika", "Elisabeth", "Sabine", "Renate", "Ingrid", "Ursula"]
nachnamen = ["Müller", "Schmidt", "Gruber", "Wagner", "Berger", "Fischer", "Koch", "Weber", "Huber", "Braun", "Lang", "Maier", "Schwarz", "Weiß", "Bauer", "Penz", "Reiter", "Senn", "Mayr", "Kröll", "Hofer", "Eder", "Lechner", "Steiner", "Moser", "Wieser", "Pichler", "Hauser", "Wolf", "Leitner"]

doctors = []

for i in range(220):
    is_m = random.choice([True, False])
    vorname = random.choice(vornamen_m if is_m else vornamen_w)
    nachname = random.choice(nachnamen)
    titel = random.choice(["Dr.", "Dr. med. univ.", "Priv.-Doz. Dr.", "Mag. Dr."])
    name = f"{titel} {vorname} {nachname}"
    
    specialty = random.choice(specialties)
    loc = random.choice(locations)
    strasse = random.choice(loc["strassen"])
    hausnummer = random.randint(1, 100)
    adresse = f"{strasse} {hausnummer}, {loc['plz']} {loc['ort']}"
    
    prefix = loc["plz"][:3]
    phone = f"+43 {prefix} {random.randint(10000, 99999)}"
    
    kasse = random.random() < 0.65
    wahlarzt = not kasse
    
    doctors.append({
        "name": name,
        "fachrichtung": specialty,
        "adresse": adresse,
        "telefon": phone,
        "kasse": kasse,
        "wahlarzt": wahlarzt,
        "ort": loc["ort"]
    })

data = {
    "region": "Tirol",
    "aerzte": doctors
}

with open('public/doctors.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print(f"Generated {len(doctors)} doctors.")
