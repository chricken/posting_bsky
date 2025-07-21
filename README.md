# 📱 Bluesky Thread Poster

Eine moderne Web-Anwendung zum Erstellen und Posten von längeren Threads auf Bluesky.

## ✨ Features

- **Einfache Authentifizierung** mit Bluesky Handle und App Password
- **Dynamische Thread-Erstellung** mit mehreren Posts und individuellen Steuerungen
- **Formatierung** von Posts (Normal, Code, Kursiv)
- **JSON Import/Export** für einfache Übertragung und Bearbeitung von Threads
- **Zeichenzähler** für jeden Post (300 Zeichen Limit)
- **Automatische Textbereinigung** für optimales Textlayout (Entfernt Zeilenumbrüche vor Punktuation)
- **Responsive Design** für Desktop und Mobile
- **Moderne UI** mit Modals
- **Frontend-only** - keine Server-Installation nötig

## 🚀 Installation und Start

1. **Repository klonen oder Dateien herunterladen**

2. **Lokalen Server starten:**
   Einfach eine der folgenden Methoden verwenden:
   ```bash
   # Mit Python
   python -m http.server
   
   # Mit Node.js
   npx serve
   
   # Mit PHP
   php -S localhost:8000

   # Mit Live Server (Visual Studio Code)
   
   ```
   
   Die App ist dann im Browser unter der entsprechenden URL verfügbar (meist `http://localhost:8000` oder ähnlich)

## 🔧 Verwendung

### 1. Anmeldung
- Gib dein Bluesky Handle ein (z.B. `deinname.bsky.social`)
- Erstelle ein **App Password** in deinen Bluesky Einstellungen:
  - Gehe zu Bluesky → Einstellungen → App Passwords
  - Erstelle ein neues App Password
  - Verwende dieses Password (nicht dein normales Passwort!)

### 2. Thread erstellen
- Schreibe deinen ersten Post in das Hauptfeld
- Weitere Posts werden automatisch hinzugefügt oder mit dem + Button neben jedem Post
- Wähle für jeden Post die gewünschte Formatierung (Normal, Code, Kursiv)
- Jeder Post kann bis zu 300 Zeichen haben
- Du kannst bis zu 200 Posts pro Thread erstellen
- Die automatische Textbereinigung entfernt Zeilenumbrüche vor Punktuation für optimale Lesbarkeit

### 3. Thread posten
- Klicke auf "🚀 Thread posten"
- Die App postet alle Posts nacheinander als zusammenhängenden Thread
- Du erhältst eine Bestätigung wenn der Thread erfolgreich gepostet wurde

## 🛠️ Technische Details

### Bluesky API Integration
- Verwendet die offizielle Bluesky AT Protocol API
- Authentifizierung über `com.atproto.server.createSession`
- Posts werden über `com.atproto.repo.createRecord` erstellt
- Automatische Thread-Verkettung durch Reply-Referenzen

### Technologie-Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **API:** Bluesky AT Protocol REST API
- **Dev Server:** http-server für lokale Entwicklung

### Sicherheit
- App Passwords werden nur temporär im Speicher gehalten
- Keine Speicherung von Anmeldedaten
- HTTPS-Kommunikation mit Bluesky API

## 📝 Keyboard Shortcuts

- **Ctrl + Enter:** Thread posten (wenn in einem Textfeld)

## 🎨 Features im Detail

### Responsive Design
- Optimiert für Desktop und Mobile Geräte
- Touch-freundliche Bedienelemente
- Adaptive Layouts

### Benutzerfreundlichkeit
- Echtzeit-Zeichenzähler mit Farbkodierung
- JSON Import/Export für einfache Thread-Übertragung
- Automatische Textbereinigung für bessere Lesbarkeit
- Intuitive Bedienung mit klaren Buttons
- Statusmeldungen für alle Aktionen

### Fehlerbehandlung
- Validierung aller Eingaben
- Aussagekräftige Fehlermeldungen
- Retry-Mechanismen für API-Aufrufe

## 🔍 Troubleshooting

### Anmeldung funktioniert nicht
- Überprüfe dein Handle (muss vollständig sein, z.B. `name.bsky.social`)
- Stelle sicher, dass du ein **App Password** verwendest, nicht dein normales Passwort
- App Passwords erstellst du in den Bluesky Einstellungen

### Posts werden nicht gepostet
- Überprüfe deine Internetverbindung
- Stelle sicher, dass Posts nicht zu lang sind (max. 300 Zeichen)
- Bei wiederholten Fehlern: Neu anmelden

### Browser-Kompatibilität
- Moderne Browser (Chrome, Firefox, Safari, Edge)
- JavaScript muss aktiviert sein
- Cookies müssen erlaubt sein

## 📄 Lizenz

MIT License - Du kannst die App frei verwenden und anpassen.

## 🤝 Beitragen

Verbesserungsvorschläge und Bug-Reports sind willkommen!

---

**Viel Spaß beim Threaden auf Bluesky! 🐦💙**
